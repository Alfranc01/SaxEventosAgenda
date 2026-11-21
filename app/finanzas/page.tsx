'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMXN } from '@/lib/utils';

export default function FinanzasPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/finanzas')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] pb-20 px-4 py-8 relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] overflow-hidden z-0">
        <img src="/logo.svg" alt="Watermark" className="w-[800px] object-contain filter grayscale" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <Link href="/agenda" className="text-[#556B2F] font-bold hover:underline flex items-center gap-1 text-sm">
            &larr; Volver a Agenda
          </Link>
          <div className="h-8 flex items-center">
            <img src="/logo.svg" alt="alansax" className="h-full object-contain" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500">Calculando finanzas...</div>
        ) : !data ? (
          <div className="text-center py-20 text-red-600">Error al cargar datos financieros</div>
        ) : (
          <div className="space-y-6">
            
            {/* Tarjetas de Saldo Obtenido y Saldo Pendiente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="ig-card p-6 border-l-4 border-l-emerald-600 shadow-sm bg-white">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Saldo Obtenido (Realizado)</span>
                <h2 className="text-3xl font-black text-[#2C2C2C] mt-2">{formatMXN(data.saldoObtenido)}</h2>
                <p className="text-xs text-zinc-500 mt-1">Total de anticipos y liquidaciones cobradas</p>
              </div>

              <div className="ig-card p-6 border-l-4 border-l-[#556B2F] shadow-sm bg-white">
                <span className="text-xs font-bold text-[#556B2F] uppercase tracking-widest">Saldo Pendiente (Por Cobrar)</span>
                <h2 className="text-3xl font-black text-[#2C2C2C] mt-2">{formatMXN(data.saldoPendiente)}</h2>
                <p className="text-xs text-zinc-500 mt-1">Restante pendiente de liquidar en eventos futuros</p>
              </div>
            </div>

            {/* Tarjetas de Resumen por Periodo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="ig-card p-6 shadow-sm bg-white">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ganancias Mes Actual</span>
                <h2 className="text-2xl font-black text-[#2C2C2C] mt-1">{formatMXN(data.totalMesActual)}</h2>
              </div>
              <div className="ig-card p-6 shadow-sm bg-white">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ganancias Año Actual</span>
                <h2 className="text-2xl font-black text-[#2C2C2C] mt-1">{formatMXN(data.totalAnio)}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="ig-card p-5 shadow-sm bg-white">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Últimos 3 Meses</span>
                <h3 className="text-xl font-bold text-[#2C2C2C] mt-1">{formatMXN(data.total3Meses)}</h3>
              </div>
              <div className="ig-card p-5 shadow-sm bg-white">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Últimos 6 Meses</span>
                <h3 className="text-xl font-bold text-[#2C2C2C] mt-1">{formatMXN(data.total6Meses)}</h3>
              </div>
            </div>

            {/* Histórico */}
            <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm text-center">
              <span className="text-xs font-bold text-[#556B2F] uppercase tracking-widest">Ganancias Brutas Totales (Histórico)</span>
              <h2 className="text-4xl font-black text-[#2C2C2C] mt-2">{formatMXN(data.totalAcumuladoHistorico)}</h2>
              <p className="text-xs text-zinc-500 mt-2">Incluye anticipos conservados de cancelados y saldos liquidados acumulados.</p>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
