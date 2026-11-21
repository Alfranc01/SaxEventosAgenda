'use client';

import React from 'react';
import { formatMXN, formatDateLocal, formatTime, formatPhone } from '@/lib/utils';
import Link from 'next/link';
import { IconCalendar, IconClock, IconPhone, IconLocation, IconFile } from '@/components/ui/Icons';

interface EventoCardProps {
  evento: {
    _id: string;
    numero_evento: string;
    cliente_nombre: string;
    cliente_telefono: string;
    tipo_evento: string;
    fecha_evento: string;
    hora_inicio: string;
    hora_fin: string;
    lugar_url: string;
    tiempo_servicio: string;
    estado: 'AGENDADO' | 'REPROGRAMADO' | 'CANCELADO';
    precio_original: number;
    anticipo_pagado: number;
    nuevo_precio_total: number;
    saldo_liquidar: number;
  };
}

export default function EventoCard({ evento }: EventoCardProps) {
  const isLiquidado = evento.saldo_liquidar <= 0 && evento.estado !== 'CANCELADO';
  const isCancelado = evento.estado === 'CANCELADO';
  const isReprogramado = evento.estado === 'REPROGRAMADO';

  // Estilos basados en el tema Lujo Orgánico
  let cardStyle = 'bg-white border border-[#E5E1D8] hover:border-[#556B2F]/50 shadow-sm hover:shadow-md';
  if (isCancelado) {
    cardStyle = 'bg-zinc-50 border border-zinc-200 opacity-60 grayscale';
  } else if (isLiquidado) {
    cardStyle = 'bg-white border-l-4 border-l-emerald-600 shadow-sm';
  }

  return (
    <div className={`relative rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-1 ${cardStyle}`}>
      {/* Etiqueta logística */}
      <div className="absolute top-5 right-5 flex gap-2">
        {isCancelado && (
          <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Cancelado
          </span>
        )}
        {isReprogramado && !isCancelado && (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Reprogramado
          </span>
        )}
        {isLiquidado && !isCancelado && (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Liquidado
          </span>
        )}
      </div>

      {/* Cabecera */}
      <div className="mb-4 pr-24">
        <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">
          {evento.numero_evento} • {evento.tipo_evento}
        </span>
        <h3 className="text-2xl font-black text-[#2C2C2C] mt-1 tracking-tight">
          {evento.cliente_nombre}
        </h3>
      </div>

      {/* Info con Iconos Minimalistas */}
      <div className="space-y-3 mb-6 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#F9F7F2] flex items-center justify-center text-zinc-500">
            <IconCalendar />
          </div>
          <span className="font-semibold text-zinc-600">{formatDateLocal(evento.fecha_evento)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#F9F7F2] flex items-center justify-center text-zinc-500">
            <IconClock />
          </div>
          <span className="font-bold text-[#556B2F]">
            {formatTime(evento.hora_inicio)} - {formatTime(evento.hora_fin)} hrs
          </span>
          <span className="text-zinc-400 text-xs">({evento.tiempo_servicio})</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#F9F7F2] flex items-center justify-center text-zinc-500">
            <IconPhone />
          </div>
          <a href={`tel:${evento.cliente_telefono}`} className="text-[#556B2F] hover:underline font-semibold transition-colors">
            {formatPhone(evento.cliente_telefono)}
          </a>
        </div>
      </div>

      {/* Sección Financiera Compacta */}
      <div className="bg-[#F9F7F2] rounded-2xl p-4 mb-6 border border-[#E5E1D8] grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Total</span>
          <span className="text-sm font-extrabold text-[#2C2C2C]">{formatMXN(evento.nuevo_precio_total)}</span>
        </div>
        <div>
          <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Anticipo</span>
          <span className="text-sm font-extrabold text-emerald-600">{formatMXN(evento.anticipo_pagado)}</span>
        </div>
        <div>
          <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Saldo</span>
          <span className={`text-sm font-extrabold ${evento.saldo_liquidar > 0 ? 'text-amber-600' : 'text-zinc-400'}`}>
            {formatMXN(evento.saldo_liquidar)}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={evento.lugar_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-zinc-600 font-bold py-3 px-4 rounded-2xl text-center transition-all border border-[#E5E1D8] text-xs"
        >
          <IconLocation /> Maps
        </a>
        <Link
          href={`/eventos/${evento._id}`}
          className="flex items-center justify-center gap-2 bg-[#556B2F] hover:bg-[#6B8E23] text-white font-extrabold py-3 px-4 rounded-2xl text-center transition-all shadow-md shadow-[#556B2F]/20 text-xs"
        >
          <IconFile /> Detalles
        </Link>
      </div>
    </div>
  );
}
