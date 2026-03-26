import { useState, useEffect } from 'react';
import { Percent, Save, RefreshCcw, AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { getBrands, getCategories, applyBulkDiscount, applyBulkPriceUpdate } from '../../lib/admin';
import './Promotions.css';

export default function Promotions() {
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    // Mode: 'discount' (sale_price) or 'update' (base price)
    const [mode, setMode] = useState('discount');
    const [updateType, setUpdateType] = useState('increase'); // 'increase' or 'decrease'

    // Form state
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [percentage, setPercentage] = useState(10);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Security PIN state
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [b, c] = await Promise.all([getBrands(), getCategories()]);
                setBrands(b);
                setCategories(c);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleUnlock = (e) => {
        e.preventDefault();
        if (pin === '1234') {
            setIsUnlocked(true);
            setPinError(false);
        } else {
            setPinError(true);
            setTimeout(() => setPinError(false), 2000);
        }
    };

    const handleApply = async (resetOrAction) => {
        if (!isUnlocked) return;

        if (resetOrAction !== 'reset' && (percentage <= 0 || percentage > 500)) {
            setStatus({ type: 'error', message: 'El porcentaje debe ser válido (1-500)' });
            return;
        }

        let confirmMsg = '';
        if (resetOrAction === 'reset') {
            confirmMsg = '¿Estás seguro de que quieres ELIMINAR todos los precios de oferta en este rango?';
        } else if (mode === 'discount') {
            confirmMsg = `¿Deseas aplicar un ${percentage}% de DESCUENTO (Precio de Oferta) a los productos seleccionados?`;
        } else {
            confirmMsg = `¿Deseas ${updateType === 'increase' ? 'AUMENTAR' : 'BAJAR'} el PRECIO DE LISTA un ${percentage}% permanentemente?`;
        }

        if (!confirm(confirmMsg)) return;

        setApplying(true);
        setStatus({ type: '', message: '' });

        try {
            let count = 0;
            if (mode === 'discount') {
                count = await applyBulkDiscount({
                    brandId: selectedBrand || null,
                    categoryId: selectedCategory || null,
                    percentage,
                    reset: resetOrAction === 'reset'
                });
            } else {
                count = await applyBulkPriceUpdate({
                    brandId: selectedBrand || null,
                    categoryId: selectedCategory || null,
                    percentage,
                    mode: updateType
                });
            }

            setStatus({
                type: 'success',
                message: resetOrAction === 'reset'
                    ? `Se eliminaron las ofertas de ${count} productos.`
                    : `¡Éxito! Operación completada en ${count} productos.`
            });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Error al aplicar cambios: ' + err.message });
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <div className="admin-loading">Cargando datos...</div>;

    return (
        <div className="promotions">
            <div className="promotions__header">
                <div className="promotions__title-area">
                    <Percent className="text-[#C4956A]" size={32} />
                    <div>
                        <h1>Actualización Masiva</h1>
                        <p>Modifica precios u ofertas por porcentaje de forma profesional.</p>
                    </div>
                </div>

                <div className="mode-toggle">
                    <button
                        className={`mode-btn ${mode === 'discount' ? 'active' : ''}`}
                        onClick={() => setMode('discount')}
                    >
                        DESCUENTOS (OFERTAS)
                    </button>
                    <button
                        className={`mode-btn ${mode === 'update' ? 'active' : ''}`}
                        onClick={() => setMode('update')}
                    >
                        PRECIO DE LISTA (INFLACIÓN)
                    </button>
                </div>
            </div>

            <div className="promotions__grid">
                <div className="promotions__card glass">
                    <div className="promotions__card-header">
                        <h2>{mode === 'discount' ? 'Configurar Ofertas' : 'Actualizar Precios Reales'}</h2>
                        <span className={`badge ${mode === 'discount' ? 'badge--blue' : 'badge--orange'}`}>
                            {mode === 'discount' ? 'OFERTA' : 'MODIFICACIÓN BASE'}
                        </span>
                    </div>

                    <div className="promotions__form">
                        <div className="form-group">
                            <label>Filtrar por Marca</label>
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                className="form-control"
                            >
                                <option value="">Todas las marcas</option>
                                {brands.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Filtrar por Familia/Categoría</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="form-control"
                            >
                                <option value="">Todas las categorías</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {mode === 'update' && (
                            <div className="form-group">
                                <label>Acción</label>
                                <div className="update-actions-toggle">
                                    <button
                                        className={`action-btn ${updateType === 'increase' ? 'active increase' : ''}`}
                                        onClick={() => setUpdateType('increase')}
                                    >
                                        <TrendingUp size={16} /> AUMENTAR
                                    </button>
                                    <button
                                        className={`action-btn ${updateType === 'decrease' ? 'active decrease' : ''}`}
                                        onClick={() => setUpdateType('decrease')}
                                    >
                                        <TrendingDown size={16} /> BAJAR
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Porcentaje (%)</label>
                            <div className="percentage-input-wrapper">
                                <input
                                    type="number"
                                    value={percentage}
                                    onChange={(e) => setPercentage(Number(e.target.value))}
                                    min="1"
                                    className="form-control"
                                />
                                <span className="percentage-symbol">%</span>
                            </div>
                            <p className="form-help">
                                {mode === 'discount'
                                    ? 'Crea un precio inferior tachando el original.'
                                    : 'Cambia el precio base permanentemente (Inflación).'}
                            </p>
                        </div>

                        {status.message && (
                            <div className={`status-box status-box--${status.type}`}>
                                {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                                <span>{status.message}</span>
                            </div>
                        )}

                        {!isUnlocked ? (
                            <div className={`promotions__lock ${pinError ? 'promotions__lock--error' : ''}`}>
                                <div className="promotions__lock-icon">
                                    <AlertCircle size={24} />
                                </div>
                                <h3>Sección Protegida</h3>
                                <p>Ingresa el código de seguridad para habilitar cambios masivos.</p>
                                <form onSubmit={handleUnlock} className="promotions__pin-form">
                                    <input
                                        type="password"
                                        placeholder="CÓDIGO"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        maxLength={4}
                                        autoFocus
                                    />
                                    <button type="submit" className="btn btn-unlock">Desbloquear</button>
                                </form>
                            </div>
                        ) : (
                            <div className="promotions__actions">
                                <button
                                    className={`btn ${mode === 'update' ? 'btn-warning' : 'btn-primary'}`}
                                    onClick={() => handleApply('apply')}
                                    disabled={applying}
                                >
                                    {applying ? <RefreshCcw className="animate-spin" /> : <Save size={18} />}
                                    <span>{mode === 'discount' ? 'Aplicar Descuento' : 'Actualizar Precios'}</span>
                                </button>

                                {mode === 'discount' && (
                                    <button
                                        className="btn btn-outline-danger"
                                        onClick={() => handleApply('reset')}
                                        disabled={applying}
                                    >
                                        <RefreshCcw size={18} />
                                        <span>Quitar Ofertas</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="promotions__info-card glass">
                    <h3>Preguntas Frecuentes</h3>
                    <ul className="info-list">
                        <li>
                            <strong>¿Qué diferencia hay?</strong> El DESCUENTO no cambia tu precio base, solo añade un "precio tachado". La ACTUALIZACIÓN cambia el precio real de la etiqueta.
                        </li>
                        <li>
                            <strong>¿Puedo aumentar?</strong> Sí, en modo "Precio de Lista" puedes subir precios (por ejemplo un 15% por inflación).
                        </li>
                        <li>
                            <strong>Filtrado:</strong> Puedes elegir una marca específica para subirle los precios solo a esa marca.
                        </li>
                    </ul>

                    <div className="warning-note">
                        <AlertCircle size={16} />
                        <p><strong>CUIDADO:</strong> Los cambios en Precio de Lista son permanentes. Asegúrate de los filtros antes de aplicar.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
