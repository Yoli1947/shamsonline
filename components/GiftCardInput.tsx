import React, { useState } from 'react';
import { Gift, X, ChevronRight, Loader } from 'lucide-react';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export interface GiftCardData {
    code: string;
    hash_token: string;
    current_balance: number;
    initial_balance: number;
    is_valid: boolean;
    status: string;
    amountToApply: number;
}

interface Props {
    orderTotal: number;
    onApply: (data: GiftCardData) => void;
    onRemove: () => void;
    applied: GiftCardData | null;
}

async function checkBalance(code: string) {
    const res = await fetch(`${FUNCTIONS_URL}/echo-check-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });
    const data = await res.json();
    if (!res.ok || !data.is_valid) {
        throw new Error(data.error || 'Gift card no válida');
    }
    return data;
}

export async function redeemGiftCard(
    hashToken: string,
    amount: number,
    orderId: string
): Promise<{ success: boolean; new_balance: number; error?: string }> {
    try {
        const res = await fetch(`${FUNCTIONS_URL}/echo-redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hash_token: hashToken,
                amount,
                order_id: orderId,
            }),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, new_balance: 0, error: data.error };
        return { success: true, new_balance: data.new_balance };
    } catch {
        return { success: false, new_balance: 0, error: 'Error de conexión' };
    }
}

const GiftCardInput: React.FC<Props> = ({ orderTotal, onApply, onRemove, applied }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCheck = async () => {
        if (!code.trim()) return;
        setError('');
        setLoading(true);
        try {
            const data = await checkBalance(code);
            const amountToApply = Math.min(data.current_balance, orderTotal);
            onApply({ ...data, amountToApply });
            setCode('');
        } catch (err: any) {
            setError(err.message || 'Gift card inválida');
        } finally {
            setLoading(false);
        }
    };

    if (applied) {
        return (
            <div style={{ padding: '12px 16px', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Gift size={16} color="#000" />
                    <div>
                        <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#000' }}>
                            Gift Card aplicada — {applied.code}
                        </p>
                        <p style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                            Descuento: <strong style={{ color: '#000' }}>-${applied.amountToApply.toLocaleString('es-AR')}</strong>
                            {applied.current_balance > applied.amountToApply && (
                                <span style={{ color: '#999', marginLeft: '6px' }}>
                                    (saldo restante: ${(applied.current_balance - applied.amountToApply).toLocaleString('es-AR')})
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px' }}
                    title="Quitar gift card"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div>
            <p style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#999', marginBottom: '8px' }}>
                ¿Tenés una Gift Card?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#999' }}>
                        <Gift size={15} />
                    </div>
                    <input
                        type="text"
                        placeholder="ECHO-XXXX-XXXX"
                        value={code}
                        onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCheck())}
                        style={{
                            width: '100%',
                            backgroundColor: '#f5f5f5',
                            border: error ? '1px solid #fca5a5' : '1px solid #e0e0e0',
                            padding: '10px 12px 10px 40px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            color: '#000',
                            outline: 'none',
                            textTransform: 'uppercase',
                        }}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleCheck}
                    disabled={loading || !code.trim()}
                    style={{
                        padding: '10px 16px',
                        backgroundColor: '#000',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                        opacity: loading || !code.trim() ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    {loading ? <Loader size={14} className="animate-spin" /> : <><span>Aplicar</span><ChevronRight size={14} strokeWidth={3} /></>}
                </button>
            </div>
            {error && (
                <p style={{ marginTop: '6px', fontSize: '10px', fontWeight: 700, color: '#c00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {error}
                </p>
            )}
        </div>
    );
};

export default GiftCardInput;
