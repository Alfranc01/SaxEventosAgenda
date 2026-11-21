'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatTime } from '@/lib/utils';

interface GoogleCalendarViewProps {
  eventos: Array<any>;
}

export default function GoogleCalendarView({ eventos }: GoogleCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const calendarDays = [];
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  return (
    <div className="bg-[#FDFBF7] p-6 shadow-xl rounded-3xl border border-[#E5E1D8]">
      {/* Controles de Navegación del Calendario */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-[#2C2C2C] tracking-tight">
              {monthNames[month]} <span className="text-[#556B2F]">{year}</span>
            </h2>
            <button
              onClick={goToToday}
              className="bg-[#556B2F]/10 hover:bg-[#556B2F]/20 text-[#556B2F] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border border-[#556B2F]/30"
            >
              Hoy
            </button>
          </div>
          <p className="text-xs text-[#2C2C2C]/60 font-semibold tracking-wider uppercase mt-0.5 hidden sm:block">Vista Mensual Interactiva</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#2C2C2C] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-[#E5E1D8] transition-all"
          >
            &larr; Mes Ant.
          </button>
          <button
            onClick={nextMonth}
            className="bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#2C2C2C] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-[#E5E1D8] transition-all"
          >
            Mes Sig. &rarr;
          </button>
        </div>
      </div>


      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#2C2C2C]/50 uppercase tracking-widest mb-3">
        <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
      </div>

      {/* Cuadrícula del Calendario */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-28 sm:h-32 bg-[#FDFBF7]/40 rounded-2xl border border-transparent"></div>;
          }

          const dateString = date.toISOString().split('T')[0];
           const eventosDelDia = eventos.filter((ev: any) => {
             if (!ev.fecha_evento) return false;
             const evDate = new Date(ev.fecha_evento).toISOString().split('T')[0];
             return evDate === dateString;
           }).sort((a, b) => {
             const horaA = a.hora_inicio || '00:00';
             const horaB = b.hora_inicio || '00:00';
             return horaA.localeCompare(horaB);
           });

          const isToday = new Date().toISOString().split('T')[0] === dateString;

          return (
            <div
              key={`day-${date.getDate()}`}
              className={`h-28 sm:h-32 bg-[#F9F7F2] rounded-2xl p-2 border overflow-y-auto flex flex-col justify-between transition-all hover:border-[#556B2F]/40 ${
                isToday ? 'border-[#556B2F] ring-2 ring-[#556B2F]/20 shadow-md shadow-[#556B2F]/10' : 'border-[#E5E1D8]'
              }`}
            >
              <div className="flex justify-between items-center text-xs font-semibold text-[#2C2C2C]/70 px-1">
                <span className={isToday ? 'bg-[#556B2F] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold' : ''}>
                  {date.getDate()}
                </span>
                {eventosDelDia.length > 0 && (
                  <span className="text-[10px] bg-[#E5E1D8] text-[#556B2F] px-2 py-0.5 rounded-full font-bold">
                    {eventosDelDia.length}
                  </span>
                )}
              </div>

               {/* Eventos en el día */}
               <div className="space-y-1 mt-1 overflow-y-auto pr-1 custom-scrollbar">
                 {eventosDelDia.map((ev: any) => {
                   const isLiquidado = ev.saldo_liquidar <= 0 && ev.estado !== 'CANCELADO';
                   const isCancelado = ev.estado === 'CANCELADO';
                   
                   let badgeColor = 'bg-[#556B2F]/10 text-[#556B2F] border-[#556B2F]/30';
                   if (isCancelado) badgeColor = 'bg-zinc-200 text-zinc-500 border-zinc-300 line-through';
                   else if (isLiquidado) badgeColor = 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30';
                   
                   return (
                     <Link
                       key={ev._id}
                       href={`/eventos/${ev._id}`}
                       className={`block text-[10px] px-1.5 py-1 rounded-md border truncate font-medium hover:opacity-80 transition-opacity ${badgeColor}`}
                       title={`${ev.cliente_nombre} - ${ev.tipo_evento} (${formatTime(ev.hora_inicio)})`}
                     >
                       <span className="font-black opacity-80">{formatTime(ev.hora_inicio)}</span> {ev.cliente_nombre}
                     </Link>
                   );
                 })}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
