import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, ArrowLeft } from 'lucide-react';

const OutletMaintenance: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAF7F2] px-6 py-16 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-[#f4e8dc] p-4">
            <Wrench className="h-8 w-8 text-black" />
          </div>
        </div>

        <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500 mb-3">Outlet</p>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-[0.2em] text-black mb-4">
          En mantenimiento
        </h1>
        <p className="text-base md:text-lg text-zinc-600 leading-relaxed mb-8">
          La sección Outlet estará disponible próximamente. Mientras tanto, podés seguir navegando por nuestra tienda principal.
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default OutletMaintenance;
