
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCcw, Percent, AlertCircle, Landmark } from 'lucide-react';
import { getSiteSettings, updateSiteSetting } from '../../lib/admin';
import { useSettings } from '../../context/SettingsContext';
import './Dashboard.css'; // Reusing some base dashboard/admin styles

export default function Settings() {
    const { refreshSettings } = useSettings();
    const [settings, setSettings] = useState({
        transfer_discount: 15,
        bank_holder: 'YOLANDA TERUZ',
        bank_cbu: '0070233320000006212542',
        bank_alias: '',
        bank_name: 'Banco Galicia',
        whatsapp_number: '5493412175258',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        async function load() {
            try {
                const data = await getSiteSettings();
                if (data) {
                    setSettings(prev => ({
                        ...prev,
                        ...data
                    }));
                }
            } catch (err) {
                console.error(err);
                setStatus({ type: 'error', message: 'Error al cargar configuraciones' });
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatus({ type: '', message: '' });

        try {
            await Promise.all([
                updateSiteSetting('transfer_discount', settings.transfer_discount),
                updateSiteSetting('bank_holder', settings.bank_holder, 'Titular cuenta bancaria'),
                updateSiteSetting('bank_cbu', settings.bank_cbu, 'CBU'),
                updateSiteSetting('bank_alias', settings.bank_alias, 'Alias CBU'),
                updateSiteSetting('bank_name', settings.bank_name, 'Banco'),
                updateSiteSetting('whatsapp_number', settings.whatsapp_number, 'Teléfono WhatsApp Tienda'),
            ]);
            await refreshSettings();
            setStatus({ type: 'success', message: 'Configuración guardada correctamente' });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Error al guardar los cambios' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="admin-loading">Cargando configuración...</div>;

    return (
        <div className="admin-settings p-4 md:p-8">
            <header className="flex items-center gap-4 mb-10">
                <div className="p-3 rounded-2xl bg-[#DCDCDC]/10 border border-[#DCDCDC]/20">
                    <SettingsIcon className="text-[#DCDCDC]" size={32} />
                </div>
                <div>
                    <h1 className="admin-title !mb-1 text-2xl font-black uppercase tracking-widest text-[var(--color-text)]">Configuración del Sitio</h1>
                    <p className="text-[var(--color-text-muted)] text-xs font-medium uppercase tracking-[0.2em]">Ajusta los parámetros generales de la tienda en tiempo real.</p>
                </div>
            </header>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="admin-card glass p-8 !bg-[#0A0A0A]/80 backdrop-blur-xl border-[var(--color-border)]">
                        <div className="flex items-center gap-3 mb-8">
                            <Percent className="text-[#DCDCDC]" size={20} />
                            <h2 className="text-lg font-bold text-[var(--color-text)] uppercase tracking-widest">Descuentos y Pagos</h2>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
                                Porcentaje de Descuento por Transferencia (%)
                            </label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={settings.transfer_discount}
                                    onChange={(e) => setSettings({ ...settings, transfer_discount: Number(e.target.value) })}
                                    className="admin-input !h-16 !text-xl !font-bold !tracking-widest transition-all group-hover:border-[#DCDCDC]/40"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">%</div>
                            </div>
                            <p className="text-[10px] text-zinc-600 leading-relaxed uppercase tracking-wider">
                                Este valor se aplica en las etiquetas de productos, carrito y checkout cuando el cliente elige transferencia.
                            </p>
                        </div>

                        <div className="space-y-3 mt-8">
                            <label className="block text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
                                Número de WhatsApp de la Tienda (con código de país)
                            </label>
                            <input
                                type="text"
                                className="admin-input"
                                value={settings.whatsapp_number}
                                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                                placeholder="Ej: 5493412175258"
                            />
                            <p className="text-[10px] text-zinc-600 leading-relaxed uppercase tracking-wider">
                                Este es el número que recibirá los mensajes de pedidos por transferencia y efectivo.
                            </p>
                        </div>
                    </div>

                    <div className="admin-card glass p-8 !bg-[#0A0A0A]/80 backdrop-blur-xl border-[var(--color-border)]">
                        <div className="flex items-center gap-3 mb-8">
                            <Landmark className="text-[#DCDCDC]" size={20} />
                            <h2 className="text-lg font-bold text-[var(--color-text)] uppercase tracking-widest">Datos Bancarios (Transferencia)</h2>
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-6 leading-relaxed">
                            Se envían automáticamente por WhatsApp cuando el cliente elige pagar por transferencia.
                        </p>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Titular</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={settings.bank_holder}
                                    onChange={(e) => setSettings({ ...settings, bank_holder: e.target.value })}
                                    placeholder="Ej: YOLANDA TERUZ"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">CBU</label>
                                <input
                                    type="text"
                                    className="admin-input font-mono tracking-wider"
                                    value={settings.bank_cbu}
                                    onChange={(e) => setSettings({ ...settings, bank_cbu: e.target.value })}
                                    placeholder="22 dígitos"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Alias (opcional)</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={settings.bank_alias}
                                    onChange={(e) => setSettings({ ...settings, bank_alias: e.target.value })}
                                    placeholder="Ej: shams.online"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Banco</label>
                                <input
                                    type="text"
                                    className="admin-input"
                                    value={settings.bank_name}
                                    onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                                    placeholder="Ej: Banco Galicia"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {status.message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${status.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                        {status.type === 'error' ? <AlertCircle size={16} /> : <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
                        <span>{status.message}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="admin-btn admin-btn-primary w-full !h-16 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {saving ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
                    <span className="text-[10px] font-black tracking-[0.3em]">GUARDAR CAMBIOS</span>
                </button>
            </form>
        </div>
    );
}
