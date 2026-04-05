
import React from 'react';
import { X, Copy, Check, MessageCircle, ExternalLink } from 'lucide-react';

interface OrderSuccessProps {
    order: any;
    bankDetails: {
        holder: string;
        cbu: string;
        alias: string;
        bank: string;
    };
    onClose: () => void;
    whatsappNumber: string;
    whatsappMsg: string;
}

const OrderSuccessModal: React.FC<OrderSuccessProps> = ({ order, bankDetails, onClose, whatsappNumber, whatsappMsg }) => {
    const [copied, setCopied] = React.useState<string | null>(null);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white p-8 md:p-12 overflow-y-auto max-h-[90vh] shadow-2xl animate-in fade-in zoom-in duration-500">
                <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-black transition-colors">
                    <X size={24} />
                </button>

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-emerald-100 flex items-center justify-center rounded-none mx-auto mb-6">
                        <Check className="text-emerald-500" size={32} />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">¡Pedido Recibido!</h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Número de Pedido: #{order.order_number}</p>
                </div>

                <div className="space-y-8">
                    <div className="bg-zinc-50 border border-zinc-100 p-8 rounded-none">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-zinc-400">Datos para la Transferencia</h4>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-zinc-200 pb-3">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total a Transferir</p>
                                    <p className="text-2xl font-black tracking-tighter">${order.total.toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(order.total.toString(), 'Monto')}
                                    className="text-zinc-400 hover:text-black flex items-center gap-2 text-[10px] font-black tracking-widest uppercase transition-colors"
                                >
                                    {copied === 'Monto' ? 'Copiado' : <Copy size={14} />}
                                </button>
                            </div>

                            {[
                                { label: 'Banco', value: bankDetails.bank },
                                { label: 'Titular', value: bankDetails.holder },
                                { label: 'CBU', value: bankDetails.cbu },
                                { label: 'Alias', value: bankDetails.alias },
                            ].map((item) => item.value && (
                                <div key={item.label} className="flex justify-between items-center group">
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{item.label}</p>
                                        <p className="text-sm font-bold tracking-tight text-zinc-800 break-all">{item.value}</p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(item.value, item.label)}
                                        className="text-zinc-400 hover:text-black opacity-0 group-hover:opacity-100 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all"
                                    >
                                        {copied === item.label ? 'Copiado' : <Copy size={14} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[11px] font-medium text-zinc-500 text-center uppercase tracking-wider leading-relaxed">
                            Por favor, una vez realizada la transferencia, envía el comprobante por WhatsApp para que podamos procesar tu envío.
                        </p>
                        
                        <a
                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-black text-white py-5 flex items-center justify-center gap-3 font-black text-xs tracking-[0.4em] uppercase hover:bg-zinc-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <MessageCircle size={20} /> Mandar Comprobante
                        </a>

                        <button
                            onClick={onClose}
                            className="w-full py-5 text-zinc-400 bg-transparent border border-zinc-200 font-bold text-[10px] tracking-widest uppercase hover:text-black hover:border-black transition-all"
                        >
                            Cerrar y Seguir Comprando
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessModal;
