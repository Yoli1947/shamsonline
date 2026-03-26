import React, { useState, useEffect } from 'react';
import { Gift, Search, Filter, Mail, CheckCircle, Clock, XCircle, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const GiftCards: React.FC = () => {
    const [giftCards, setGiftCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchGiftCards();
    }, []);

    const fetchGiftCards = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('gift_cards')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGiftCards(data || []);
        } catch (error) {
            console.error('Error fetching gift cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('gift_cards')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setGiftCards(prev => prev.map(gc => gc.id === id ? { ...gc, status: newStatus } : gc));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const filteredCards = giftCards.filter(gc => {
        const matchesSearch =
            gc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gc.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gc.sender_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || gc.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'used': return 'bg-zinc-500/10 text-[var(--color-text-muted)] border-zinc-500/20';
            case 'expired': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-[var(--color-text)] flex items-center gap-3">
                        <Gift className="text-[#C4956A]" />
                        GESTIÓN DE GIFT CARDS
                    </h2>
                    <p className="text-[var(--color-text-muted)] text-sm tracking-widest uppercase mt-1">Administra y valida tarjetas de regalo virtuales</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar código o nombre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white0 border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C4956A] w-64 text-[var(--color-text)]"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'TOTAL', value: giftCards.length, icon: Gift, color: 'text-[var(--color-text)]' },
                    { label: 'ACTIVAS', value: giftCards.filter(g => g.status === 'active').length, icon: CheckCircle, color: 'text-green-500' },
                    { label: 'PENDIENTES', value: giftCards.filter(g => g.status === 'pending').length, icon: Clock, color: 'text-amber-500' },
                    { label: 'USADAS', value: giftCards.filter(g => g.status === 'used').length, icon: XCircle, color: 'text-[var(--color-text-muted)]' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white0 border border-[var(--color-border)] rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-[var(--color-text-muted)] tracking-[0.2em] mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                        <stat.icon className={`${stat.color} opacity-20`} size={32} />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white/30 border border-[var(--color-border)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--color-border)] bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] tracking-widest uppercase">Código</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] tracking-widest uppercase">Remitente</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] tracking-widest uppercase">Destinatario</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] tracking-widest uppercase">Monto</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] tracking-widest uppercase">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] tracking-widest uppercase">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCards.map((gc) => (
                                <tr key={gc.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-[#C4956A] font-black tracking-wider text-sm">{gc.code}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[var(--color-text)] font-bold text-sm">{gc.sender_name}</span>
                                            <span className="text-[var(--color-text-muted)] text-[10px]">{gc.sender_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[var(--color-text)] font-bold text-sm">{gc.recipient_name}</span>
                                            <span className="text-[var(--color-text-muted)] text-[10px]">{gc.recipient_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[var(--color-text)] font-black text-sm">${Number(gc.amount).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${getStatusStyle(gc.status)}`}>
                                            {gc.status === 'pending' ? 'PENDIENTE' : gc.status === 'active' ? 'ACTIVA' : gc.status === 'used' ? 'USADA' : 'EXPIRADA'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {gc.status === 'pending' && (
                                                <button
                                                    onClick={() => updateStatus(gc.id, 'active')}
                                                    className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-[var(--color-text)] rounded-lg transition-all"
                                                    title="Activar"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            {gc.status === 'active' && (
                                                <button
                                                    onClick={() => updateStatus(gc.id, 'used')}
                                                    className="p-2 bg-zinc-500/10 text-[var(--color-text-muted)] hover:bg-zinc-500 hover:text-[var(--color-text)] rounded-lg transition-all"
                                                    title="Marcar como Usada"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GiftCards;
