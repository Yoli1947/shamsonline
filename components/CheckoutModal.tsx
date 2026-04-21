
import React, { useState, useEffect, useRef } from 'react';
import { X, Loader, MapPin, ExternalLink } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { checkPromoAlreadyUsed } from '../lib/orders';
import GiftCardInput, { GiftCardData, redeemGiftCard } from './GiftCardInput';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => Promise<void>;
    total: number;
}

const CUSTOMER_STORAGE_KEY = 'shams_customer_data';

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirm, total }) => {
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);
    const transferDiscount = settings.transfer_discount || 15;

    const getSavedCustomer = () => {
        try {
            const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    };

    const [formData, setFormData] = useState(() => {
        const saved = getSavedCustomer();
        return {
            firstName: saved.firstName || '',
            lastName: saved.lastName || '',
            email: saved.email || '',
            phone: saved.phone || '',
            address: saved.address || '',
            addressNumber: saved.addressNumber || '',
            city: saved.city || '',
            province: saved.province || '',
            postalCode: saved.postalCode || '',
            dni: saved.dni || '',
            floor: saved.floor || '',
            apartment: saved.apartment || '',
            shippingMethod: 'envio',
            pickupLocationId: 'local_favorita',
            paymentMethod: 'mercadopago'
        };
    });

    const [giftCard, setGiftCard] = useState<GiftCardData | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [shippingQuote, setShippingQuote] = useState<{ cost: number; days: string } | null>(null);
    const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
    const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hasPromo = localStorage.getItem('shams_promo_10') === 'true';
    const [promoAlreadyUsed, setPromoAlreadyUsed] = useState(false);
    const [checkingPromo, setCheckingPromo] = useState(false);
    const effectiveHasPromo = hasPromo && !promoAlreadyUsed;

    // Verificar si el beneficio de primera compra ya fue usado (por email o DNI)
    useEffect(() => {
        if (!hasPromo) return;
        const email = formData.email.trim();
        const dni = formData.dni.trim();
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailValid && !dni) { setPromoAlreadyUsed(false); return; }

        const timer = setTimeout(async () => {
            setCheckingPromo(true);
            try {
                const used = await checkPromoAlreadyUsed(emailValid ? email : '', dni || null);
                setPromoAlreadyUsed(used);
            } catch { /* silencioso */ } finally {
                setCheckingPromo(false);
            }
        }, 700);
        return () => clearTimeout(timer);
    }, [formData.email, formData.dni, hasPromo]);

    // Cotización automática al ingresar CP (solo en envío a domicilio)
    useEffect(() => {
        if (formData.shippingMethod !== 'envio') return;
        const cp = formData.postalCode.trim();
        if (cp.length < 4) { setShippingQuote(null); return; }

        if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
        quoteTimerRef.current = setTimeout(async () => {
            setShippingQuoteLoading(true);
            try {
                const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
                const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                
                const res = await fetch(`${functionsUrl}/correo-rates`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${supabaseAnonKey}`
                    },
                    body: JSON.stringify({ postalCode: cp }),
                });
                
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                
                // La API puede devolver un array de opciones o un objeto con price/cost
                const firstOption = Array.isArray(data) ? data[0] : data;
                
                const cost = firstOption?.price || 
                             firstOption?.cost || 
                             firstOption?.totalPrice || 
                             firstOption?.total || 
                             firstOption?.priceWithTaxes;
                             
                if (cost) {
                    const days = firstOption?.deliveryTime || firstOption?.days || firstOption?.prazo || '';
                    setShippingQuote({ cost: Number(cost), days: String(days) });
                } else {
                    setShippingQuote(null);
                }
            } catch (error) {
                console.error('Shipping quote error:', error);
                
                // Fallback local si es de Rosario y la API falló
                if (cp === '2000' || cp === '2152' || cp.startsWith('20')) {
                    setShippingQuote({ cost: 4500, days: '2 a 4' });
                } else if (cp.length === 4) {
                    // Fallback general para Argentina si al menos tiene 4 dígitos
                    setShippingQuote({ cost: 9500, days: '5 a 10' });
                } else {
                    setShippingQuote(null);
                }
            } finally {
                setShippingQuoteLoading(false);
            }
        }, 800);
    }, [formData.postalCode, formData.shippingMethod]);

    // Mapeo básico de ciudades a códigos postales
    const CITY_TO_CP: Record<string, string> = {
        'rosario': '2000',
        'caba': '1000',
        'capital federal': '1000',
        'buenos aires': '1000',
        'cordoba': '5000',
        'santa fe': '3000',
        'mendoza': '5500',
        'la plata': '1900',
        'mar del plata': '7600',
        'san miguel de tucuman': '4000',
        'salta': '4400',
        'posadas': '3300',
        'corrientes': '3400',
        'parana': '3100',
        'resistencia': '3500'
    };

    // Puntos de Retiro
    const PICKUP_LOCATIONS = [
        {
            id: 'local_favorita',
            name: 'PERRAMUS-SHAMS (LA FAVORITA)',
            address: 'Córdoba 1101, Rosario (Local en La Favorita)',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Cordoba+1101,+Rosario,+Santa+Fe',
            schedule: 'Lunes a Sábado de 10:00 a 20:00'
        },
        {
            id: 'perramus_siglo',
            name: 'PERRAMUS-HUNTER (SHOPPING DEL SIGLO)',
            address: 'Pte. Roca 844, Rosario (Local 110)',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Pte.+Roca+844,+Rosario,+Santa+Fe',
            schedule: 'Lunes a Domingos de 9:00 a 20:00'
        },
        {
            id: 'perramus_fisherton',
            name: 'PERRAMUS - HUNTER - NAUTICA (Fisherton Plaza)',
            address: 'Alberto J. Paz 1065 bis, Rosario',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Alberto+J.+Paz+1065+bis,+Rosario,+Santa+Fe',
            schedule: 'Lunes a Domingo de 10:00 a 20:00'
        },
        {
            id: 'perramus_cordoba',
            name: 'PERRAMUS-HUNTER (PLAZA PRINGLES)',
            address: 'Córdoba 1543, Rosario',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Cordoba+1543,+Rosario,+Santa+Fe',
            schedule: 'Lun a Vie 9:30 a 19:30 | Sáb 9:30 a 19:00'
        },
        {
            id: 'shams_store_cordoba',
            name: 'SHAMS - ROSARIO',
            address: 'Córdoba 1646, Rosario',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Cordoba+1646,+Rosario,+Santa+Fe',
            schedule: 'Lun a Vie 9:30 a 19:30 | Sáb 9:30 a 19:00'
        },
        {
            id: 'monacle_tienda',
            name: 'MONACLE TIENDA',
            address: 'Pte Roca 871, Rosario',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Pte+Roca+871,+Rosario,+Santa+Fe',
            schedule: 'Lunes a Sábados de 10:00 a 20:00'
        }
    ];

    // Auto-completar CP basado en ciudad
    React.useEffect(() => {
        if (!formData.city) return;

        const cityLower = formData.city.toLowerCase().trim();
        const suggestedCP = CITY_TO_CP[cityLower];

        // Solo auto-completar si encontramos match y el campo CP está vacío o es un auto-completado previo
        if (suggestedCP && (!formData.postalCode || formData.postalCode.length < 2)) {
            setFormData(prev => ({ ...prev, postalCode: suggestedCP }));
            // Marcar como tocado para mostrar check verde
            setTouched(prev => ({ ...prev, postalCode: true }));
        }
    }, [formData.city]);

    // Validaciones
    const validateField = (name: string, value: string) => {
        let error = '';
        switch (name) {
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Email inválido';
                break;
            case 'phone':
                if (value.length < 8) error = 'Mínimo 8 números';
                else if (!/^[0-9\-\s\+]+$/.test(value)) error = 'Solo números y guiones';
                break;
            case 'dni':
                if (value.length < 7) error = 'DNI inválido';
                else if (!/^\d+$/.test(value)) error = 'Solo números';
                break;
            case 'firstName':
            case 'lastName':
            case 'address':
            case 'city':
            case 'province':
                if (value.length < 2) error = 'Muy corto';
                break;
        }
        return error;
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Guardar datos del cliente para autocompletar en próximas compras
        try {
            const { shippingMethod, pickupLocationId, paymentMethod, ...customerData } = formData;
            localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customerData));
        } catch { /* no crítico */ }
        try {
            const quotedShipping = formData.shippingMethod === 'retiro' ? 0 : (shippingQuote?.cost ?? null);
            const promoFactor = (hasPromo && !promoAlreadyUsed) ? 0.9 : 1;
            const shipping = formData.shippingMethod === 'retiro' ? 0 : (shippingQuote?.cost ?? 0);
            const afterPromo = Math.round(total * promoFactor) + shipping;
            const gcDiscount = giftCard ? giftCard.amountToApply : 0;
            const amountToChargeMP = Math.max(0, afterPromo - gcDiscount);

            const giftCardApplied = giftCard ? {
                code: giftCard.code,
                hash_token: giftCard.hash_token,
                amount_to_deduct: gcDiscount,
            } : null;

            // Si la gift card cubre el total → canjear directo sin MP
            if (giftCard && amountToChargeMP === 0) {
                const result = await redeemGiftCard(giftCard.hash_token, gcDiscount, '');
                if (!result.success) throw new Error(result.error || 'Error al canjear la gift card.');
            }

            await onConfirm({
                ...formData,
                shippingQuotedCost: quotedShipping,
                promoAlreadyUsed,
                gift_card_applied: giftCardApplied,
                gift_card_discount: gcDiscount,
                amount_to_charge_mp: amountToChargeMP,
            });
        } catch (error: any) {
            console.error(error);
            alert(`Error al procesar el pedido: ${error.message || 'Por favor intente nuevamente'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Validar en tiempo real si ya fue tocado
        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    // Helper para input con validación — estilo WooCommerce (label visible arriba)
    const renderInput = (name: keyof typeof formData, placeholder: string, label: string, autoComplete: string, type: string = "text", required: boolean = true) => (
        <div className="space-y-1">
            <label htmlFor={name} className="block text-[11px] font-semibold text-[#333] uppercase tracking-wider">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type={type}
                    autoComplete={autoComplete}
                    required={required}
                    placeholder={placeholder}
                    className={`w-full bg-white text-black p-3 outline-none transition-all border text-sm ${errors[name] && touched[name]
                        ? 'border-red-400'
                        : touched[name] && !errors[name] && formData[name]
                            ? 'border-black'
                            : 'border-[#ccc] focus:border-black'
                        }`}
                    value={formData[name]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />
                {touched[name] && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {errors[name] ? (
                            <span className="text-red-500 text-xs font-bold">!</span>
                        ) : formData[name] ? (
                            <span className="text-green-600 text-xs font-bold">✓</span>
                        ) : null}
                    </div>
                )}
            </div>
            {errors[name] && touched[name] && (
                <p className="text-red-500 text-[10px] font-medium">{errors[name]}</p>
            )}
        </div>
    );

    const PROVINCES = ['Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'];

    // Calcular totales
    const promoFactor = effectiveHasPromo ? 0.9 : 1;
    const paymentDiscountFactor = (formData.paymentMethod === 'transferencia' || formData.paymentMethod === 'efectivo') ? (1 - transferDiscount / 100) : 1;
    const shipping = formData.shippingMethod === 'retiro' ? 0 : (shippingQuote?.cost ?? 0);
    const subtotal = total;
    const afterDiscounts = Math.round(subtotal * promoFactor * paymentDiscountFactor);
    const gcDiscount = giftCard ? giftCard.amountToApply : 0;
    const finalTotal = Math.max(0, afterDiscounts + shipping - gcDiscount);
    const paymentDesc = formData.paymentMethod === 'transferencia'
        ? `${transferDiscount}% OFF - Transferencia / Depósito bancario`
        : formData.paymentMethod === 'efectivo'
        ? `${transferDiscount}% OFF - Efectivo en sucursal`
        : null;

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="min-h-full flex items-start justify-center py-8 px-4">
                <div className="relative w-full max-w-5xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-[#e0e0e0]">
                        <h2 className="text-xl font-black uppercase tracking-widest text-black">Finalizar Compra</h2>
                        <button onClick={onClose} className="text-[#999] hover:text-black transition-colors">
                            <X size={22} />
                        </button>
                    </div>

                    {hasPromo && (
                        <div className="mx-8 mt-4 flex items-center gap-3 p-3 border border-black bg-black/5">
                            <span className="text-base">🎉</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-black">10% OFF EXTRA EN TU PRIMERA COMPRA — BENEFICIO APLICADO</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col lg:flex-row">

                            {/* ── COLUMNA IZQUIERDA: Formulario ── */}
                            <div className="flex-1 px-8 py-6 space-y-5 border-r border-[#e0e0e0]">

                                {/* Detalles personales */}
                                <h3 className="text-sm font-black uppercase tracking-widest text-black border-b border-[#e0e0e0] pb-2">Detalles personales</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    {renderInput('firstName', 'Juan', 'Nombre', 'given-name')}
                                    {renderInput('lastName', 'Pérez', 'Apellido', 'family-name')}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {renderInput('email', 'juan@email.com', 'Correo electrónico', 'email', 'email')}
                                    {renderInput('phone', '341-1234567', 'Teléfono', 'tel')}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {renderInput('dni', '30123456', 'DNI', 'off')}
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-[#333] uppercase tracking-wider">País / Región</label>
                                        <div className="w-full border border-[#ccc] p-3 bg-[#f9f9f9] text-sm text-[#555]">Argentina</div>
                                    </div>
                                </div>

                                {/* Envío */}
                                <h3 className="text-sm font-black uppercase tracking-widest text-black border-b border-[#e0e0e0] pb-2 pt-2">Envío</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setFormData({ ...formData, shippingMethod: 'envio' })}
                                        className={`p-3 border text-left transition-all flex items-start gap-2 ${formData.shippingMethod === 'envio' ? 'border-black bg-black/5' : 'border-[#ccc] hover:border-black'}`}>
                                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${formData.shippingMethod === 'envio' ? 'border-black' : 'border-[#ccc]'}`}>
                                            {formData.shippingMethod === 'envio' && <div className="w-2 h-2 rounded-full bg-black" />}
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-black">Envío a domicilio</span>
                                            <span className="text-[10px] text-[#666]">Correo Argentino · 5-10 días hábiles</span>
                                        </div>
                                    </button>
                                    <button type="button" onClick={() => setFormData({ ...formData, shippingMethod: 'retiro' })}
                                        className={`p-3 border text-left transition-all flex items-start gap-2 ${formData.shippingMethod === 'retiro' ? 'border-black bg-black/5' : 'border-[#ccc] hover:border-black'}`}>
                                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${formData.shippingMethod === 'retiro' ? 'border-black' : 'border-[#ccc]'}`}>
                                            {formData.shippingMethod === 'retiro' && <div className="w-2 h-2 rounded-full bg-black" />}
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-black">Retiro en local</span>
                                            <span className="text-[10px] text-[#666]">Pasá a buscarlo · </span>
                                            <span className="text-[10px] font-black text-black">GRATIS</span>
                                        </div>
                                    </button>
                                </div>

                                {/* Campos de dirección */}
                                {formData.shippingMethod === 'envio' && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-2">{renderInput('address', 'Av. Santa Fe', 'Calle', 'street-address')}</div>
                                            {renderInput('addressNumber', '1234', 'Número', 'off')}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {renderInput('floor', 'Ej: 3', 'Piso', 'off', 'text', false)}
                                            {renderInput('apartment', 'Ej: B', 'Departamento', 'off', 'text', false)}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {renderInput('city', 'Rosario', 'Ciudad / Población', 'address-level2')}
                                            <div className="space-y-1">
                                                <label className="block text-[11px] font-semibold text-[#333] uppercase tracking-wider">Provincia <span className="text-red-500">*</span></label>
                                                <select
                                                    name="province"
                                                    required
                                                    value={formData.province}
                                                    onChange={e => setFormData(prev => ({ ...prev, province: e.target.value }))}
                                                    className="w-full border border-[#ccc] p-3 text-sm focus:border-black outline-none bg-white"
                                                >
                                                    <option value="">Seleccioná...</option>
                                                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            {renderInput('postalCode', '2000', 'Código Postal', 'postal-code')}
                                        </div>
                                        {/* Cotización Correo */}
                                        <div className="flex items-start gap-3 bg-[#f9f9f9] border border-[#e0e0e0] p-3">
                                            <span className="text-base">📦</span>
                                            <div className="flex-1 text-xs">
                                                <p className="font-bold text-black">Costo de envío — Correo Argentino</p>
                                                {shippingQuoteLoading && <p className="text-[#888] mt-1">Calculando...</p>}
                                                {!shippingQuoteLoading && shippingQuote && (
                                                    <p className="mt-1 font-black text-black">${shippingQuote.cost.toLocaleString()} <span className="font-normal text-[#666]">· {shippingQuote.days} días hábiles</span></p>
                                                )}
                                                {!shippingQuoteLoading && !shippingQuote && formData.postalCode.length < 4 && (
                                                    <p className="text-[#888] mt-1">Ingresá tu código postal para calcular el envío.</p>
                                                )}
                                                {!shippingQuoteLoading && !shippingQuote && formData.postalCode.length >= 4 && (
                                                    <p className="text-[#888] mt-1">No se pudo calcular. Te contactaremos.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Puntos de retiro */}
                                {formData.shippingMethod === 'retiro' && (
                                    <div className="space-y-2 animate-in fade-in">
                                        <p className="text-[11px] font-semibold text-[#333] uppercase tracking-wider">Seleccioná un local</p>
                                        {PICKUP_LOCATIONS.map(location => {
                                            const isSelected = formData.pickupLocationId === location.id;
                                            return (
                                                <div key={location.id} onClick={() => setFormData({ ...formData, pickupLocationId: location.id })}
                                                    className={`p-3 border cursor-pointer transition-all flex items-start gap-3 ${isSelected ? 'border-black bg-black/5' : 'border-[#ccc] hover:border-black'}`}>
                                                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-black' : 'border-[#ccc]'}`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="text-xs font-bold text-black flex items-center gap-1"><MapPin size={11} />{location.name}</p>
                                                                <p className="text-[11px] text-[#555] mt-0.5">{location.address}</p>
                                                                <p className="text-[10px] text-[#888]">{location.schedule}</p>
                                                            </div>
                                                            <a href={location.mapUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                                                className="text-[10px] text-[#666] hover:text-black border border-[#ccc] px-2 py-1 flex items-center gap-1 hover:border-black transition-all">
                                                                Ver mapa <ExternalLink size={9} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* ── COLUMNA DERECHA: Resumen + Pago ── */}
                            <div className="w-full lg:w-[380px] px-8 py-6 space-y-5 bg-[#f9f9f9]">

                                {/* Tu pedido */}
                                <h3 className="text-sm font-black uppercase tracking-widest text-black border-b border-[#e0e0e0] pb-2">Tu pedido</h3>
                                <table className="w-full text-xs border border-[#e0e0e0]">
                                    <thead>
                                        <tr className="border-b border-[#e0e0e0]">
                                            <th className="text-left p-2 font-bold text-[#333]">Producto</th>
                                            <th className="text-right p-2 font-bold text-[#333]">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-[#e0e0e0]">
                                            <td className="p-2 text-[#555]">Subtotal productos</td>
                                            <td className="p-2 text-right font-semibold">${subtotal.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-[#e0e0e0]">
                                            <td className="p-2 text-[#555]">Envío</td>
                                            <td className="p-2 text-right font-semibold">
                                                {formData.shippingMethod === 'retiro' ? <span className="text-green-600 font-bold">GRATIS</span>
                                                    : shippingQuote ? `$${shippingQuote.cost.toLocaleString()}`
                                                    : <span className="text-[#888] italic">Ingresá tu dirección</span>}
                                            </td>
                                        </tr>
                                        {paymentDesc && (
                                            <tr className="border-b border-[#e0e0e0]">
                                                <td className="p-2 text-[#555]">{paymentDesc}</td>
                                                <td className="p-2 text-right font-semibold text-green-700">-${(subtotal - afterDiscounts).toLocaleString()}</td>
                                            </tr>
                                        )}
                                        {effectiveHasPromo && (
                                            <tr className="border-b border-[#e0e0e0]">
                                                <td className="p-2 text-[#555]">10% OFF Primera compra</td>
                                                <td className="p-2 text-right font-semibold text-green-700">-${Math.round(subtotal * 0.1).toLocaleString()}</td>
                                            </tr>
                                        )}
                                        {gcDiscount > 0 && (
                                            <tr className="border-b border-[#e0e0e0]">
                                                <td className="p-2 text-[#555]">Gift Card</td>
                                                <td className="p-2 text-right font-semibold text-green-700">-${gcDiscount.toLocaleString()}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-white">
                                            <td className="p-2 font-black text-black text-sm">TOTAL</td>
                                            <td className="p-2 text-right font-black text-black text-sm">${finalTotal.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Gift Card */}
                                <div>
                                    {(() => {
                                        const totalAfterPromo = Math.round(subtotal * promoFactor) + shipping;
                                        return <GiftCardInput orderTotal={totalAfterPromo} applied={giftCard} onApply={setGiftCard} onRemove={() => setGiftCard(null)} />;
                                    })()}
                                </div>

                                {/* Métodos de pago */}
                                <h3 className="text-sm font-black uppercase tracking-widest text-black border-b border-[#e0e0e0] pb-2">Medio de pago</h3>
                                <div className="space-y-2">
                                    {[
                                        { id: 'transferencia', label: `${transferDiscount}% OFF — Transferencia / Depósito bancario`, desc: `Realizá tu pago por transferencia y obtenés un ${transferDiscount}% de descuento. Usá el número de pedido como referencia.` },
                                        { id: 'efectivo', label: `${transferDiscount}% OFF — Efectivo en sucursal`, desc: `Abonás en el local al retirar tu pedido y obtenés un ${transferDiscount}% de descuento.` },
                                        { id: 'mercadopago_saldo', label: 'Mercado Pago — Saldo o Tarjetas Guardadas', desc: null, mpOption: 'saldo' },
                                        { id: 'mercadopago', label: 'Mercado Pago — Tarjeta de Crédito o Débito', desc: null, mpOption: 'tarjeta' },
                                    ].map(method => {
                                        const isSelected = formData.paymentMethod === method.id;
                                        return (
                                            <div key={method.id}>
                                                <label className={`flex items-start gap-3 p-3 border cursor-pointer transition-all ${isSelected ? 'border-black bg-white' : 'border-[#ccc] hover:border-black bg-white'}`}
                                                    onClick={() => setFormData({ ...formData, paymentMethod: method.id })}>
                                                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-black' : 'border-[#ccc]'}`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                                                    </div>
                                                    <span className="text-xs font-semibold text-black">{method.label}</span>
                                                </label>
                                                {isSelected && method.desc && (
                                                    <div className="border border-t-0 border-[#ccc] bg-[#f0f0f0] p-3 text-[11px] text-[#555]">{method.desc}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {promoAlreadyUsed && (
                                    <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-600 font-bold">
                                        ❌ El descuento de primera compra ya fue utilizado con estos datos.
                                    </div>
                                )}
                                {checkingPromo && hasPromo && (
                                    <p className="text-[10px] text-[#888]">Verificando beneficio...</p>
                                )}

                                <button type="submit" disabled={loading}
                                    className="w-full bg-black text-white font-black uppercase tracking-widest py-4 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                                    {loading ? <Loader className="animate-spin" size={18} /> : 'Realizar el pedido'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CheckoutModal;
