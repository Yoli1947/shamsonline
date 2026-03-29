import React, { useState } from 'react';
import { X, MapPin, Clock, Map } from 'lucide-react';

interface StoreLocationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PICKUP_LOCATIONS = [
    {
        id: 'local_favorita',
        name: 'PERRAMUS-SHAMS (LA FAVORITA)',
        address: 'Córdoba 1101, Rosario (Local en La Favorita)',
        schedule: 'Lunes a Sábado de 10:00 a 20:00',
        embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.6!2d-60.6505!3d-32.9468!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b6534689af3c71%3A0x9dba4e23b06e4a44!2sCórdoba%201101%2C%20Rosario%2C%20Santa%20Fe!5e0!3m2!1ses!2sar!4v1700000001',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Cordoba+1101,+Rosario,+Santa+Fe',
    },
    {
        id: 'perramus_siglo',
        name: 'PERRAMUS-HUNTER (SHOPPING DEL SIGLO)',
        address: 'Pte. Roca 844, Rosario (Local 110)',
        schedule: 'Lunes a Domingos de 9:00 a 20:00',
        embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.6!2d-60.6391!3d-32.9482!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b65348b0f4b1c3%3A0x1!2sPte.+Roca+844%2C+Rosario%2C+Santa+Fe!5e0!3m2!1ses!2sar!4v1700000002',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Pte.+Roca+844,+Rosario,+Santa+Fe',
    },
    {
        id: 'perramus_fisherton',
        name: 'PERRAMUS - HUNTER - NAUTICA (Fisherton Plaza)',
        address: 'Alberto J. Paz 1065 bis, Rosario',
        schedule: 'Lunes a Domingo de 10:00 a 20:00',
        embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.6!2d-60.7254!3d-32.9298!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b654c7a1b2e3d1%3A0x1!2sAlberto+J.+Paz+1065+bis%2C+Rosario!5e0!3m2!1ses!2sar!4v1700000003',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Alberto+J.+Paz+1065+bis,+Rosario,+Santa+Fe',
    },
    {
        id: 'perramus_cordoba',
        name: 'PERRAMUS-HUNTER (PLAZA PRINGLES)',
        address: 'Córdoba 1543, Rosario',
        schedule: 'Lun a Vie 9:30 a 19:30 | Sáb 9:30 a 19:00',
        embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.6!2d-60.6535!3d-32.9472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b6534b0c2d41a7%3A0x1!2sCórdoba+1543%2C+Rosario%2C+Santa+Fe!5e0!3m2!1ses!2sar!4v1700000004',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Cordoba+1543,+Rosario,+Santa+Fe',
    },
    {
        id: 'shams_store_cordoba',
        name: 'SHAMS - ROSARIO',
        address: 'Córdoba 1646, Rosario',
        schedule: 'Lun a Vie 9:30 a 19:30 | Sáb 9:30 a 19:00',
        embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.6!2d-60.6552!3d-32.9474!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b6534b5c2d41a7%3A0x1!2sCórdoba+1646%2C+Rosario%2C+Santa+Fe!5e0!3m2!1ses!2sar!4v1700000005',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Cordoba+1646,+Rosario,+Santa+Fe',
    },
    {
        id: 'monacle_tienda',
        name: 'MONACLE TIENDA',
        address: 'Pte Roca 871, Rosario',
        schedule: 'Lunes a Sábados de 10:00 a 20:00',
        embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.6!2d-60.6393!3d-32.9483!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b65348c0f4b1c3%3A0x1!2sPte+Roca+871%2C+Rosario%2C+Santa+Fe!5e0!3m2!1ses!2sar!4v1700000006',
        mapUrl: 'https://www.google.com/maps/search/?api=1&query=Pte+Roca+871,+Rosario,+Santa+Fe',
    }
];

const StoreLocationsModal: React.FC<StoreLocationsModalProps> = ({ isOpen, onClose }) => {
    const [activeLocation, setActiveLocation] = useState(PICKUP_LOCATIONS[0]);

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }} className="animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />
            <div style={{ position: 'relative', width: '100%', maxWidth: '768px', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.2)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} className="animate-in zoom-in-95 duration-500">

                {/* Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', flexShrink: 0 }}>
                    <div>
                        <h2 style={{ color: '#000', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '16px' }}>Encontrá tu local más cercano</h2>
                        <p style={{ color: '#666', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', marginTop: '4px' }}>Rosario, Santa Fe</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', cursor: 'pointer', color: '#000' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', minHeight: 0 }}>

                    {/* Lista de locales */}
                    <div style={{ width: '42%', overflowY: 'auto', borderRight: '1px solid #e0e0e0', flexShrink: 0 }}>
                        {PICKUP_LOCATIONS.map((location) => (
                            <button
                                key={location.id}
                                onClick={() => setActiveLocation(location)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '20px',
                                    borderBottom: '1px solid #e0e0e0',
                                    borderLeft: activeLocation.id === location.id ? '3px solid #000' : '3px solid transparent',
                                    backgroundColor: activeLocation.id === location.id ? '#f5f5f5' : '#fff',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.15s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0, color: activeLocation.id === location.id ? '#000' : '#999' }} />
                                    <div>
                                        <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', color: '#000' }}>
                                            {location.name}
                                        </p>
                                        <p style={{ color: '#666', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{location.address}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#999' }}>
                                            <Clock size={9} />
                                            <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{location.schedule}</p>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Mapa */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <iframe
                                key={activeLocation.id}
                                src={activeLocation.embedUrl}
                                width="100%"
                                height="100%"
                                style={{ border: 0, minHeight: '280px', position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                        <a
                            href={activeLocation.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#f5f5f5', borderTop: '1px solid #e0e0e0', color: '#000', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', textDecoration: 'none', flexShrink: 0 }}
                        >
                            <Map size={12} />
                            ABRIR EN GOOGLE MAPS
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '16px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', backgroundColor: '#fff', flexShrink: 0 }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '12px 48px', backgroundColor: '#000', color: '#fff', fontWeight: 900, fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoreLocationsModal;
