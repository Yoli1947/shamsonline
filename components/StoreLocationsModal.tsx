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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-none overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-500 max-h-[92vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                    <div>
                        <h2 className="text-white font-black uppercase tracking-[0.2em] text-lg">Encontrá tu local más cercano</h2>
                        <p className="text-[#C4956A] text-[10px] font-bold uppercase tracking-[0.3em] opacity-90">Rosario, Santa Fe</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-none bg-black/50 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">

                    {/* Lista de locales */}
                    <div className="md:w-5/12 overflow-y-auto border-b md:border-b-0 md:border-r border-white/10 shrink-0">
                        {PICKUP_LOCATIONS.map((location) => (
                            <button
                                key={location.id}
                                onClick={() => setActiveLocation(location)}
                                className={`w-full text-left p-5 border-b border-white/5 transition-all hover:bg-white/5 ${activeLocation.id === location.id ? 'bg-[#C4956A]/10 border-l-2 border-l-[#C4956A]' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <MapPin size={14} className={`mt-0.5 shrink-0 ${activeLocation.id === location.id ? 'text-[#C4956A]' : 'text-zinc-600'}`} />
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${activeLocation.id === location.id ? 'text-[#C4956A]' : 'text-white'}`}>
                                            {location.name}
                                        </p>
                                        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-1">{location.address}</p>
                                        <div className="flex items-center gap-1 text-zinc-600">
                                            <Clock size={9} />
                                            <p className="text-[9px] font-bold uppercase tracking-wider">{location.schedule}</p>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Mapa */}
                    <div className="flex-1 flex flex-col min-h-[280px] md:min-h-0">
                        <div className="flex-1 relative">
                            <iframe
                                key={activeLocation.id}
                                src={activeLocation.embedUrl}
                                width="100%"
                                height="100%"
                                style={{ border: 0, minHeight: '280px' }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="absolute inset-0 w-full h-full"
                            />
                        </div>
                        <a
                            href={activeLocation.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 bg-[#C4956A]/10 hover:bg-[#C4956A]/20 text-[#C4956A] text-[10px] font-black uppercase tracking-[0.3em] transition-colors shrink-0"
                        >
                            <Map size={12} />
                            ABRIR EN GOOGLE MAPS
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-center bg-white/5 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-12 py-3 rounded-none bg-white text-black font-black text-[10px] tracking-[0.4em] uppercase hover:bg-[#C4956A] transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoreLocationsModal;
