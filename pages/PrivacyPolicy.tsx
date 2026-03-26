import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
            {/* Header */}
            <div className="border-b border-[var(--color-border)] px-6 py-5 flex items-center gap-4 sticky top-0 bg-[var(--color-background)]/95 backdrop-blur-sm z-50">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-xs font-black tracking-widest uppercase"
                >
                    <ArrowLeft size={16} />
                    Volver
                </button>
                <span className="text-[var(--color-text)]/20">|</span>
                <span className="text-[10px] font-black tracking-[0.4em] text-black uppercase">Shams Online — Rosario</span>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">

                {/* Título */}
                <div>
                    <p className="text-black text-[10px] font-black tracking-[0.5em] uppercase mb-4">Documento Legal</p>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
                        Políticas de<br /><span className="text-black italic">Privacidad</span>
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-sm tracking-widest">Última actualización: Febrero 2026</p>
                </div>

                <div className="w-full h-px bg-white/10" />

                {/* Sección 1 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">1. Responsable de los Datos</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        <strong className="text-[var(--color-text)]">SHAMS ONLINE</strong>, con domicilio en Córdoba 1101, Rosario, Santa Fe, Argentina, es el responsable del tratamiento de los datos personales recopilados a través del sitio web <span className="text-black">shamsonline.com.ar</span>.
                    </p>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        Podés contactarnos por cualquier consulta relacionada con tus datos personales a través de nuestros canales de atención.
                    </p>
                </section>

                {/* Sección 2 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">2. Datos que Recopilamos</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">Al realizar una compra o registrarte en nuestra plataforma, podemos recopilar los siguientes datos:</p>
                    <ul className="space-y-2 text-[var(--color-text-muted)] text-sm">
                        {[
                            'Nombre y apellido',
                            'Dirección de correo electrónico',
                            'Número de teléfono',
                            'DNI (para facturación y verificación)',
                            'Dirección de entrega',
                            'Historial de pedidos',
                            'Preferencias de navegación en el sitio',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C4956A] mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Sección 3 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">3. Finalidad del Tratamiento</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">Utilizamos tus datos personales exclusivamente para:</p>
                    <ul className="space-y-2 text-[var(--color-text-muted)] text-sm">
                        {[
                            'Procesar y gestionar tus pedidos de compra',
                            'Coordinar la entrega o el retiro de productos',
                            'Enviarte información sobre el estado de tu pedido',
                            'Ofrecerte atención al cliente y soporte posventa',
                            'Cumplir con obligaciones legales y fiscales (facturación)',
                            'Mejorar la experiencia de uso de nuestra plataforma',
                            'Enviarte comunicaciones comerciales (solo con tu consentimiento)',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C4956A] mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Sección 4 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">4. Base Legal del Tratamiento</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        El tratamiento de tus datos se realiza en cumplimiento de la <strong className="text-[var(--color-text)]">Ley N° 25.326 de Protección de Datos Personales</strong> de la República Argentina y sus normas complementarias. Al realizar una compra o crear una cuenta, prestás tu consentimiento expreso para el tratamiento de tus datos con las finalidades indicadas.
                    </p>
                </section>

                {/* Sección 5 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">5. Compartición de Datos con Terceros</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        SHAMS <strong className="text-[var(--color-text)]">no vende ni cede tus datos personales</strong> a terceros con fines comerciales. Solo podremos compartir tus datos en los siguientes casos:
                    </p>
                    <ul className="space-y-2 text-[var(--color-text-muted)] text-sm">
                        {[
                            'Empresas de logística y transporte para gestionar la entrega de tu pedido',
                            'Procesadores de pago (Mercado Pago) para gestionar transacciones de forma segura',
                            'Autoridades fiscales o judiciales cuando la ley lo exija',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C4956A] mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        Los pagos con tarjeta son procesados exclusivamente por <strong className="text-[var(--color-text)]">Mercado Pago</strong>, que cuenta con certificación PCI DSS. Shams <strong className="text-[var(--color-text)]">nunca almacena datos de tarjetas de crédito o débito</strong>.
                    </p>
                </section>

                {/* Sección 6 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">6. Seguridad de los Datos</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        Implementamos medidas técnicas y organizativas para proteger tus datos personales contra el acceso no autorizado, pérdida o alteración. Nuestro sitio utiliza conexión <strong className="text-[var(--color-text)]">HTTPS cifrada</strong> y los datos se almacenan en servidores seguros con acceso restringido.
                    </p>
                </section>

                {/* Sección 7 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">7. Cookies y Tecnologías de Seguimiento</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        Nuestro sitio puede utilizar cookies y almacenamiento local del navegador para:
                    </p>
                    <ul className="space-y-2 text-[var(--color-text-muted)] text-sm">
                        {[
                            'Recordar tu carrito de compras y favoritos',
                            'Mantener tu sesión iniciada',
                            'Mejorar el rendimiento y velocidad de carga del sitio',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C4956A] mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        Podés desactivar las cookies desde la configuración de tu navegador, aunque esto puede afectar algunas funcionalidades del sitio.
                    </p>
                </section>

                {/* Sección 8 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">8. Plazo de Conservación</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        Conservamos tus datos personales durante el tiempo necesario para cumplir con las finalidades indicadas y por los plazos legales exigidos en materia fiscal y comercial en Argentina (mínimo 5 años para documentación de ventas). Transcurrido ese plazo, los datos serán eliminados o anonimizados.
                    </p>
                </section>

                {/* Sección 9 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">9. Tus Derechos</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        De acuerdo con la Ley N° 25.326, tenés derecho a:
                    </p>
                    <ul className="space-y-2 text-[var(--color-text-muted)] text-sm">
                        {[
                            'Acceder a los datos personales que tenemos sobre vos',
                            'Rectificar datos incorrectos o incompletos',
                            'Solicitar la eliminación de tus datos (derecho al olvido)',
                            'Oponerte al tratamiento de tus datos con fines comerciales',
                            'Revocar tu consentimiento en cualquier momento',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C4956A] mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        Para ejercer estos derechos, contactanos a través de WhatsApp o en nuestros locales. La Dirección Nacional de Protección de Datos Personales (DNPDP) es el organismo de control competente.
                    </p>
                </section>

                {/* Sección 10 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">10. Política de Devoluciones y Arrepentimiento</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        De acuerdo con la <strong className="text-[var(--color-text)]">Ley N° 24.240 de Defensa del Consumidor</strong>, tenés derecho a arrepentirte de tu compra dentro de los <strong className="text-[var(--color-text)]">10 días hábiles</strong> a partir de la recepción del producto, sin necesidad de dar explicaciones y sin costo adicional, siempre que el producto se encuentre en su estado original.
                    </p>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        Para iniciar una solicitud de devolución, contactanos por WhatsApp o en nuestros locales con el número de pedido.
                    </p>
                </section>

                {/* Sección 11 */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text)]">11. Modificaciones a esta Política</h2>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        SHAMS se reserva el derecho de modificar esta Política de Privacidad en cualquier momento. Los cambios serán publicados en esta página con la fecha de actualización. Te recomendamos revisar esta política periódicamente.
                    </p>
                </section>

                <div className="w-full h-px bg-white/10" />

                {/* Footer de la página */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-8">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.4em] text-[var(--color-text-muted)] uppercase">Shams — Rosario, Santa Fe, Argentina</p>
                        <p className="text-[10px] font-black tracking-[0.3em] text-[var(--color-text-muted)] uppercase mt-1">© 2026 — Todos los derechos reservados</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-[10px] font-black tracking-[0.4em] text-black uppercase hover:text-[var(--color-text)] transition-colors border border-[#C4956A]/30 px-6 py-3 rounded-full hover:bg-[#C4956A] hover:border-[#C4956A]"
                    >
                        Ir a la tienda
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
