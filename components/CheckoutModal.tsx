
import React, { useState, useEffect, useRef } from 'react';
import { X, Loader, MapPin, ExternalLink } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { checkPromoAlreadyUsed } from '../lib/orders';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => Promise<void>;
    total: number;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirm, total }) => {
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);
    const transferDiscount = settings.transfer_discount || 15;
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        addressNumber: '',
        city: '',
        province: '',
        postalCode: '',
        dni: '',
        floor: '',
        apartment: '',
        shippingMethod: 'envio', // 'envio' | 'retiro'
        pickupLocationId: 'local_favorita', // id del punto de retiro
        paymentMethod: 'mercadopago' // 'mercadopago' | 'transferencia' | 'efectivo'
    });

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
                const res = await fetch(`${functionsUrl}/correo-rates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postalCode: cp }),
                });
                const data = await res.json();
                // La API puede devolver un array de opciones o un objeto con price/cost
                const cost = Array.isArray(data)
                    ? data[0]?.price || data[0]?.cost || data[0]?.totalPrice
                    : data.price || data.cost || data.totalPrice || data.priceWithTaxes;
                if (cost) {
                    const days = Array.isArray(data)
                        ? data[0]?.deliveryTime || data[0]?.days || ''
                        : data.deliveryTime || data.days || '';
                    setShippingQuote({ cost: Number(cost), days: String(days) });
                } else {
                    setShippingQuote(null);
                }
            } catch {
                setShippingQuote(null);
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
        try {
            const quotedShipping = formData.shippingMethod === 'retiro' ? 0 : (shippingQuote?.cost ?? null);
            await onConfirm({ ...formData, shippingQuotedCost: quotedShipping, promoAlreadyUsed });
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

    // Helper para input con validación
    const renderInput = (name: keyof typeof formData, placeholder: string, label: string, autoComplete: string, type: string = "text", required: boolean = true) => (
        <div className="space-y-1">
            <label htmlFor={name} className="sr-only">{label}</label>
            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type={type}
                    autoComplete={autoComplete}
                    required={required}
                    placeholder={placeholder}
                    className={`w-full bg-[var(--color-background-alt)] border rounded-none p-4 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 outline-none transition-all ${errors[name] && touched[name]
                        ? 'border-red-500/50 focus:border-red-500'
                        : touched[name] && !errors[name] && formData[name]
                            ? 'border-emerald-500/50 focus:border-emerald-500'
                            : 'border-[var(--color-border)] focus:border-[#C4956A]'
                        }`}
                    value={formData[name]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />
                {/* Indicador visual de estado */}
                {touched[name] && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        {errors[name] ? (
                            <span className="text-red-500 text-xs font-bold">!</span>
                        ) : formData[name] ? (
                            <span className="text-emerald-500 text-xs">✓</span>
                        ) : null}
                    </div>
                )}
            </div>
            {errors[name] && touched[name] && (
                <p className="text-red-500 text-[10px] pl-2 font-medium tracking-wide animate-in slide-in-from-left-1">{errors[name]}</p>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#2C1810]/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[var(--color-background)] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-none border border-[var(--color-border)] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-6 right-6 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                    <X size={24} />
                </button>

                <div className="mb-8">
                    <h2 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-widest">Finalizar Compra</h2>
                    {hasPromo && (
                        <div className="mt-2 inline-flex items-center gap-2 bg-[#C4956A]/10 border border-[#C4956A]/30 px-3 py-1.5 rounded-none text-[#C4956A] text-xs font-bold uppercase tracking-widest">
                            <span>🎉 10% OFF APLICADO (Primera Compra)</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {renderInput('firstName', 'Nombre (Ej: Juan)', 'Nombre', 'given-name')}
                        {renderInput('lastName', 'Apellido (Ej: Perez)', 'Apellido', 'family-name')}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {renderInput('phone', 'Teléfono (Ej: 341-1234567)', 'Teléfono', 'tel')}
                        {renderInput('dni', 'DNI (Ej: 30123456)', 'DNI', 'off')}
                    </div>

                    {renderInput('email', 'Email (Ej: juan.perez@email.com)', 'Email', 'email', 'email')}


                    {/* SELECCIÓN DE MÉTODO DE ENVÍO */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Forma de Envío</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, shippingMethod: 'envio' })}
                                className={`p-4 rounded-none border text-left transition-all ${formData.shippingMethod === 'envio'
                                    ? 'border-[#C4956A] bg-[#C4956A]/10 text-[var(--color-text)]'
                                    : 'border-[var(--color-border)] bg-[var(--color-background-alt)] text-[var(--color-text-muted)] hover:bg-[#E8D5C0]'
                                    }`}
                            >
                                <span className="block text-xs font-bold uppercase tracking-wider mb-1">Envío a Domicilio</span>
                                <span className="text-[10px] opacity-70 block">Correo Argentino</span>
                                <span className="text-[10px] opacity-50">5 a 10 días hábiles</span>
                            </button>
                             <button
                                type="button"
                                onClick={() => setFormData({ ...formData, shippingMethod: 'retiro' })}
                                className={`p-4 rounded-none border text-left transition-all relative overflow-hidden group ${formData.shippingMethod === 'retiro'
                                    ? 'border-[#C4956A] bg-[#C4956A]/10 text-[var(--color-text)]'
                                    : 'border-[var(--color-border)] bg-[var(--color-background-alt)] text-[var(--color-text-muted)] hover:bg-[#E8D5C0]'
                                    }`}
                            >
                                <span className="block text-xs font-bold uppercase tracking-wider mb-1 group-hover:text-[#C4956A] transition-colors">Retiro en Local</span>
                                <span className="text-[10px] opacity-70 block mb-1">Pasá a buscarlo por nuestros locales</span>
                                <span className="text-[10px] font-black text-[#C4956A] uppercase tracking-widest inline-block mt-1">
                                    GRATIS
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* CAMPOS DE DIRECCIÓN (SOLO SI ES ENVÍO) */}
                    {formData.shippingMethod === 'envio' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    {renderInput('address', 'Calle (Ej: Av. Santa Fe)', 'Calle', 'street-address')}
                                </div>
                                {renderInput('addressNumber', 'N°', 'Número', 'off')}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {renderInput('floor', 'Piso (Opcional)', 'Piso', 'off', 'text', false)}
                                {renderInput('apartment', 'Depto (Opcional)', 'Departamento', 'off', 'text', false)}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {renderInput('city', 'Ciudad (Ej: Rosario)', 'Ciudad', 'address-level2')}
                                <div className="grid grid-cols-2 gap-2">
                                    {renderInput('province', 'Provincia', 'Provincia', 'address-level1')}
                                    {renderInput('postalCode', 'CP', 'CP', 'postal-code')}
                                </div>
                            </div>

                             {/* Cotización Correo Argentino */}
                            <div className="flex items-start gap-3 bg-[var(--color-background-alt)] border border-[var(--color-border)] rounded-none p-4">
                                <span className="text-lg mt-0.5">📦</span>
                                <div className="space-y-1 flex-1">
                                    <p className="text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider">Envío por Correo Argentino</p>
                                    {shippingQuoteLoading && (
                                        <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                                            <span className="inline-block w-3 h-3 border border-zinc-400 border-t-transparent rounded-none animate-spin" />
                                            Calculando costo de envío...
                                        </p>
                                    )}
                                     {!shippingQuoteLoading && shippingQuote && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[13px] font-black text-[#C4956A]">${shippingQuote.cost.toLocaleString()}</span>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">costo de envío</span>
                                            {shippingQuote.days && (
                                                <span className="text-[9px] text-[var(--color-text-muted)] bg-white/5 px-2 py-0.5 rounded-none">{shippingQuote.days} días hábiles</span>
                                            )}
                                        </div>
                                    )}
                                    {!shippingQuoteLoading && !shippingQuote && formData.postalCode.length >= 4 && (
                                        <p className="text-[10px] text-zinc-500">No se pudo obtener el costo. Te contactaremos.</p>
                                    )}
                                    {!shippingQuoteLoading && formData.postalCode.length < 4 && (
                                        <p className="text-[10px] text-zinc-500">Ingresá tu código postal para ver el costo de envío.</p>
                                    )}
                                    <p className="text-[10px] text-zinc-500 mt-1">Te enviamos el número de seguimiento por WhatsApp o email.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                         /* SELECCIÓN DE PUNTO DE RETIRO */
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                            <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Punto de Retiro</label>
                            <div className="space-y-3">
                                {PICKUP_LOCATIONS.map(location => {
                                    const isSelected = formData.pickupLocationId === location.id;
                                    return (
                                        <div
                                            key={location.id}
                                             onClick={() => setFormData({ ...formData, pickupLocationId: location.id })}
                                            className={`p-4 rounded-none border transition-all cursor-pointer ${isSelected
                                                ? 'border-[#C4956A] bg-[#C4956A]/10 text-[var(--color-text)]'
                                                : 'border-[var(--color-border)] bg-[var(--color-background-alt)] hover:bg-[#E8D5C0] text-[var(--color-text-muted)]'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Indicador seleccionado */}
                                                 <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-none border-2 flex items-center justify-center transition-all ${isSelected
                                                    ? 'border-[#C4956A] bg-[#C4956A]'
                                                    : 'border-[var(--color-border)] bg-transparent'
                                                    }`}>
                                                    {isSelected && (
                                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                            <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                     <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors ${isSelected ? 'text-[#C4956A]' : 'text-[var(--color-text-muted)]'}`}>
                                                                 <MapPin size={14} /> {location.name}
                                                            </h4>
                                                            <p className="text-xs text-[var(--color-text)] font-medium mb-1">{location.address}</p>
                                                            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">{location.schedule}</p>
                                                        </div>
                                                         <a
                                                            href={location.mapUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-[#C4956A] hover:text-[var(--color-text)] uppercase tracking-widest border border-[#C4956A]/30 px-3 py-1.5 rounded-none hover:bg-[#C4956A]/10 transition-all"
                                                        >
                                                            Ver Mapa <ExternalLink size={10} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                     {/* SELECCIÓN DE MÉTODO DE PAGO */}
                    <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
                        <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Medio de Pago</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'mercadopago', label: 'Mercado Pago', discount: false },
                                { id: 'transferencia', label: 'Transferencia', discount: true },
                                { id: 'efectivo', label: 'Efectivo', discount: true }
                            ].map(method => (
                                <button
                                    key={method.id}
                                     type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                                    className={`p-3 rounded-none border text-left transition-all relative overflow-hidden ${formData.paymentMethod === method.id
                                        ? method.discount ? 'border-emerald-500 bg-emerald-500/10 text-[var(--color-text)]' : 'border-[#C4956A] bg-[#C4956A]/10 text-[var(--color-text)]'
                                        : 'border-[var(--color-border)] bg-[var(--color-background-alt)] text-[var(--color-text-muted)] hover:bg-[#E8D5C0]'
                                        }`}
                                >
                                    <span className="block text-[10px] font-bold uppercase tracking-wider mb-1">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Advertencia descuento ya usado */}
                    {promoAlreadyUsed && (
                        <div className="mt-4 p-3 rounded-none bg-red-500/10 border border-red-500/30 text-center">
                            <p className="text-xs font-bold text-red-400">
                                ❌ El descuento de primera compra ya fue utilizado con estos datos.
                            </p>
                        </div>
                    )}
                    {checkingPromo && hasPromo && (
                        <div className="mt-2 text-center text-[10px] text-zinc-500">Verificando beneficio...</div>
                    )}

                     <div className="pt-6 border-t border-[var(--color-border)] flex justify-between items-center mt-6">
                        {(() => {
                            const promoFactor = effectiveHasPromo ? 0.9 : 1;
                            const shipping = formData.shippingMethod === 'retiro' ? 0 : (shippingQuote?.cost ?? 0);
                            const finalTotal = Math.round(total * promoFactor) + shipping;
                            return (
                                 <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-widest text-[#C4956A]">Total a Pagar</span>
                                     <div className="flex items-baseline gap-2">
                                        {effectiveHasPromo && (
                                            <span className="text-sm text-[var(--color-text-muted)] tracking-wider">Total: ${(total + shipping).toLocaleString()}</span>
                                        )}
                                        <span className="text-2xl font-bold text-[var(--color-text)]">${finalTotal.toLocaleString()}</span>
                                        {effectiveHasPromo && (
                                            <span className="text-xs text-emerald-400 font-black">-10%</span>
                                        )}
                                    </div>
                                      <span className="text-[10px] text-[var(--color-text-muted)]">
                                        {formData.shippingMethod === 'retiro'
                                            ? 'Retiro sin cargo'
                                            : shippingQuote
                                                ? `+ Envío Correo Argentino $${shippingQuote.cost.toLocaleString()}`
                                                : formData.postalCode.length >= 4
                                                    ? 'Calculando envío...'
                                                    : '+ Envío (ingresá tu CP)'}
                                    </span>
                                </div>
                            );
                        })()}
                         <button type="submit" disabled={loading} className="bg-[#2C1810] text-white font-black uppercase tracking-widest px-8 py-4 rounded-none hover:bg-[#C4956A] transition-all flex items-center gap-2 disabled:opacity-50">
                            {loading ? <Loader className="animate-spin" size={20} /> : 'Confirmar Pedido'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CheckoutModal;
