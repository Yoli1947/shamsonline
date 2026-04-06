
import { useState, useEffect } from 'react'
import { Search, Mail, Phone, Calendar, User, Download, ExternalLink, RefreshCw } from 'lucide-react'
import { getAllCustomers } from '../../lib/admin'
import './Customers.css'

export default function Customers() {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadCustomers()
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm, refreshTrigger])

    async function loadCustomers() {
        try {
            setLoading(true)
            const { customers: data, count } = await getAllCustomers({ 
                limit: 200, // Menos registros por página para que sea más rápido
                search: searchTerm 
            })
            setCustomers(data)
            setTotalCount(count || 0)
        } catch (error) {
            console.error('Error loading customers:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredCustomers = customers

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const exportToCSV = () => {
        const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'DNI', 'Fecha Registro'];
        const rows = filteredCustomers.map(c => [
            c.first_name,
            c.last_name,
            c.email,
            c.phone || '',
            c.dni || '',
            c.created_at
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `clientes_shams_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (loading && customers.length === 0) {
        return (
            <div className="admin-loading">
                <RefreshCw className="animate-spin text-[#DCDCDC] mb-4" size={48} />
                <p>Cargando base de datos de clientes...</p>
            </div>
        )
    }

    return (
        <div className="admin-page customers-page">
            <header className="admin-page__header">
                <div>
                    <h1>Clientes Registrados</h1>
                    <p>Gestioná la base de datos de usuarios de tu tienda.</p>
                </div>
                <div className="admin-page__actions">
                    <button className="admin-btn admin-btn--secondary" onClick={exportToCSV}>
                        <Download size={18} />
                        Exportar CSV
                    </button>
                    <button className="admin-btn admin-btn--icon" onClick={() => setRefreshTrigger(t => t + 1)}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </header>

            <div className="admin-card">
                <div className="admin-card__filters">
                    <div className="search-input">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Contacto</th>
                                <th>DNI</th>
                                <th>Fecha Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-[var(--color-text-muted)]">
                                        No se encontraron clientes que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className="customer-info">
                                                <div className="customer-avatar">
                                                    {(customer.first_name?.[0] || 'U').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="customer-name">
                                                        {customer.first_name} {customer.last_name}
                                                    </div>
                                                    <div className="customer-id">ID: {customer.id.substring(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="customer-contact">
                                                <div className="contact-item">
                                                    <Mail size={14} />
                                                    <span>{customer.email}</span>
                                                </div>
                                                {customer.phone && (
                                                    <div className="contact-item">
                                                        <Phone size={14} />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="customer-dni">{customer.dni || '-'}</span>
                                        </td>
                                        <td>
                                            <div className="customer-date">
                                                <Calendar size={14} />
                                                <span>{formatDate(customer.created_at)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="admin-table__actions">
                                                <a
                                                    href={`mailto:${customer.email}`}
                                                    className="admin-action-btn"
                                                    title="Enviar Email"
                                                >
                                                    <Mail size={16} />
                                                </a>
                                                <button className="admin-action-btn" title="Ver Pedidos">
                                                    <ExternalLink size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="admin-card__footer">
                    {searchTerm 
                        ? `Encontrados ${customers.length} de ${totalCount} clientes`
                        : `Mostrando los últimos ${customers.length} de ${totalCount} clientes`
                    }
                </div>
            </div>
        </div>
    )
}
