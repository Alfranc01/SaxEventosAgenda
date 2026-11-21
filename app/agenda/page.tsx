'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EventoCard from '@/components/agenda/EventoCard';
import GoogleCalendarView from '@/components/agenda/GoogleCalendarView';
import Link from 'next/link';
import { IconSearch, IconCalendar, IconTrendingUp } from '@/components/ui/Icons';
import { formatMXN, formatDateLocal, formatTime } from '@/lib/utils';

export default function AgendaPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [historicoFilter, setHistoricoFilter] = useState(false);
  const [hideCancelled, setHideCancelled] = useState(false);
  const [viewMode, setViewMode] = useState<'tarjetas' | 'calendario'>('tarjetas');
  const [nextEvent, setNextEvent] = useState<any>(null);

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (estadoFilter) params.append('estado', estadoFilter);
      if (historicoFilter) params.append('historico', 'true');

      const res = await fetch(`/api/eventos?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const filteredData = hideCancelled 
          ? data.filter((ev: any) => ev.estado !== 'CANCELADO') 
          : data;
          
        setEventos(filteredData);
        if (!historicoFilter && filteredData.length > 0) {
          setNextEvent(filteredData[0]);
        }
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, [estadoFilter, historicoFilter, hideCancelled]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEventos();
  };

  const handleFilterClick = (estado: string, historico: boolean) => {
    setEstadoFilter(estado);
    setHistoricoFilter(historico);
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] pb-20 relative overflow-x-hidden">
      {/* Marca de agua elegante de fondo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] overflow-hidden z-0">
        <img src="/logo.svg" alt="Watermark" className="w-[800px] object-contain filter grayscale" />
      </div>

      {/* Header Unificado */}
      <header className="bg-[#E2E4D5] backdrop-blur-xl border-b border-[#C7C9B7] sticky top-0 z-30 px-4 py-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-44 flex items-center justify-start overflow-hidden">
              <img src="/logo.svg" alt="alansax" className="h-full object-contain" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              href="/cotizador"
              className="bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#2C2C2C] font-bold px-4 py-2.5 rounded-xl text-sm border border-[#E5E1D8] transition-all flex items-center gap-2"
            >
              Cotizar
            </Link>
            <Link
              href="/finanzas"
              className="bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#2C2C2C] font-bold px-4 py-2.5 rounded-xl text-sm border border-[#E5E1D8] transition-all flex items-center gap-2"
            >
              <IconTrendingUp /> Finanzas
            </Link>
            <Link
              href="/eventos/nuevo"
              className="bg-[#556B2F] hover:bg-[#6B8E23] text-white font-extrabold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[#556B2F]/30"
            >
              + Nuevo Evento
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10 space-y-8">
        
        {/* SECCIÓN: Evento más próximo (Resumen Ejecutivo) */}
        <AnimatePresence mode="wait">
          {!historicoFilter && nextEvent && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="ig-card p-6 border-l-4 border-l-[#556B2F] shadow-xl bg-white/60 backdrop-blur-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <IconCalendar /> Próximo Compromiso
                </h2>
                <span className="text-[10px] font-bold bg-[#556B2F] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Urgente</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-black text-[#2C2C2C]">{nextEvent.cliente_nombre}</h3>
                  <p className="text-[#556B2F] text-sm font-medium">{nextEvent.tipo_evento}</p>
                </div>
                <div className="text-left sm:text-right space-y-1">
                  <p className="text-sm font-bold text-[#2C2C2C]">{formatDateLocal(nextEvent.fecha_evento)}</p>
                  <p className="text-[#556B2F] font-mono text-sm">{formatTime(nextEvent.hora_inicio)} hrs</p>
                </div>
                  <Link 
                    href={`/eventos/${nextEvent._id}`} 
                    className="bg-[#2C2C2C] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-black transition-all"
                  >
                    Detalles
                  </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buscador y Selector de Vista */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Buscar por cliente, tipo o folio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ig-input pl-10 pr-4 py-3 text-sm placeholder-zinc-500"
              />
            </div>
            <button
              type="submit"
              className="bg-white hover:bg-[#F9F7F2] border border-[#E5E1D8] px-5 py-3 rounded-xl font-bold text-[#2C2C2C] transition-all"
            >
              Buscar
            </button>
          </form>

          <div className="flex bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('tarjetas')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'tarjetas' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-[#2C2C2C]'
              }`}
            >
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode('calendario')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'calendario' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-[#2C2C2C]'
              }`}
            >
              Calendario
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl p-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleFilterClick(estadoFilter, false)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                !historicoFilter ? 'bg-[#556B2F] text-white shadow-sm' : 'text-zinc-500 hover:text-[#2C2C2C]'
              }`}
            >
              Eventos por Venir
            </button>
            <button
              type="button"
              onClick={() => handleFilterClick(estadoFilter, true)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                historicoFilter ? 'bg-[#556B2F] text-white shadow-sm' : 'text-zinc-500 hover:text-[#2C2C2C]'
              }`}
            >
              Eventos Vencidos
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              type="button"
              onClick={() => handleFilterClick(estadoFilter === 'AGENDADO' ? '' : 'AGENDADO', historicoFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                estadoFilter === 'AGENDADO' ? 'bg-[#2C2C2C] text-white' : 'bg-white text-zinc-500 hover:text-[#2C2C2C] border border-[#E5E1D8]'
              }`}
            >
              Agendados
            </button>
            <button
              type="button"
              onClick={() => handleFilterClick(estadoFilter === 'REPROGRAMADO' ? '' : 'REPROGRAMADO', historicoFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                estadoFilter === 'REPROGRAMADO' ? 'bg-[#2C2C2C] text-white' : 'bg-white text-zinc-500 hover:text-[#2C2C2C] border border-[#E5E1D8]'
              }`}
            >
              Reprogramados
            </button>
            <button
              type="button"
              onClick={() => handleFilterClick(estadoFilter === 'CANCELADO' ? '' : 'CANCELADO', historicoFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                estadoFilter === 'CANCELADO' ? 'bg-red-600 text-white' : 'bg-white text-zinc-500 hover:text-[#2C2C2C] border border-[#E5E1D8]'
              }`}
            >
              Cancelados
            </button>
            <button
              type="button"
              onClick={() => setHideCancelled(!hideCancelled)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                hideCancelled ? 'bg-zinc-200 text-black' : 'bg-white text-zinc-500 hover:text-[#2C2C2C] border border-[#E5E1D8]'
              }`}
            >
              Ocultar Cancelados
            </button>
          </div>
        </div>

        {/* Listado */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="ig-card border-2 border-[#E5E1D8] rounded-[28px] p-6 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
                  <div className="h-6 bg-zinc-200 rounded-full w-20"></div>
                </div>
                <div className="h-8 bg-zinc-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3 mb-6">
                  <div className="h-4 bg-zinc-100 rounded w-1/2"></div>
                  <div className="h-4 bg-zinc-100 rounded w-2/3"></div>
                  <div className="h-4 bg-zinc-100 rounded w-1/3"></div>
                </div>
                <div className="bg-[#F9F7F2] rounded-2xl p-4 mb-6 border border-[#E5E1D8] grid grid-cols-3 gap-2">
                  <div className="h-8 bg-zinc-100 rounded"></div>
                  <div className="h-8 bg-zinc-100 rounded"></div>
                  <div className="h-8 bg-zinc-100 rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-11 bg-zinc-100 rounded-2xl"></div>
                  <div className="h-11 bg-zinc-100 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : eventos.length === 0 ? (
          <div className="text-center py-20 ig-card">
            <p className="text-zinc-400 text-base mb-2">No se encontraron eventos</p>
            <Link
              href="/eventos/nuevo"
              className="inline-block mt-2 text-[#556B2F] font-bold hover:underline"
            >
              Crear tu primer evento ahora &rarr;
            </Link>
          </div>
        ) : viewMode === 'tarjetas' ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {eventos.map((evento: any, index: number) => (
              <motion.div
                key={evento._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EventoCard evento={evento} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <GoogleCalendarView eventos={eventos} />
        )}
      </div>
    </main>
  );
}
