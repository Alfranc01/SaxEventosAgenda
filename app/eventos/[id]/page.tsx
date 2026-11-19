'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatMXN, formatDateLocal, formatLocationName, formatPhone } from '@/lib/utils';
import { IconCalendar, IconClock, IconPhone, IconLocation, IconFile, IconEdit } from '@/components/ui/Icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function VerDetalleEventoPage() {
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [marcandoLiquidado, setMarcandoLiquidado] = useState(false);
  const [error, setError] = useState('');
  const [evento, setEvento] = useState<any>(null);
  const [showRecibo, setShowRecibo] = useState(false);

  const reciboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/eventos/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setEvento(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar detalle');
        setLoading(false);
      });
  }, [id]);

  const handleMarcarLiquidado = async () => {
    if (!confirm('Deseas marcar este evento como liquidado (pago cubierto antes del evento)?')) return;
    setMarcandoLiquidado(true);
    try {
      const res = await fetch(`/api/eventos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liquidar: true })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setEvento(data);
      }
    } catch (err) {
      console.error('Error al liquidar evento:', err);
      alert('Error al marcar como liquidado');
    } finally {
      setMarcandoLiquidado(false);
    }
  };

  const generarPDF = async (): Promise<boolean> => {
    if (!reciboRef.current) return false;
    try {
      const canvas = await html2canvas(reciboRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Comprobante_${evento.numero_evento}.pdf`);
      return true;
    } catch (err) {
      console.error('Error al generar PDF:', err);
      return false;
    }
  };

  const handleDescargarPDF = async () => {
    setGenerandoPDF(true);
    await generarPDF();
    setGenerandoPDF(false);
  };

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] flex items-center justify-center">Cargando detalles...</div>;
  if (error || !evento) return <div className="min-h-screen bg-[#FDFBF7] text-red-600 flex items-center justify-center">{error || 'Evento no encontrado'}</div>;

  const isLiquidado = evento.saldo_liquidar <= 0 && evento.estado !== 'CANCELADO';
  const isCancelado = evento.estado === 'CANCELADO';
  const isReprogramado = evento.estado === 'REPROGRAMADO';

  const reciboTemplate = evento && (
    <div className="bg-white text-slate-900 p-6 sm:p-8 space-y-6">
      <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6">
          <div className="flex items-center gap-4">
            <img src="/logo-dark.svg" alt="alansax" className="h-14 w-auto object-contain" />
            <div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">Alan Franco Moraila</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Servicios Musicales de Saxofon Profesional</p>
          </div>
        </div>
        <div className="text-right bg-[#F9F7F2] border border-[#E5E1D8] px-4 py-2.5 rounded-xl shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#556B2F] mb-0.5">Folio de Control</div>
          <div className="text-xl font-mono font-black text-[#2C2C2C] tracking-wider whitespace-nowrap">
            {evento.numero_evento}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-3 text-slate-900 text-xs">
        <div className="flex items-end gap-4">
          <span className="font-black uppercase tracking-wider text-slate-500 w-40">Fecha de Emision:</span>
          <div className="flex-1 border-b border-slate-200 pb-1 font-bold">
            {formatDateLocal(evento.fecha_evento)}
          </div>
        </div>

        <div className="flex items-end gap-4">
          <span className="font-black uppercase tracking-wider text-slate-500 w-40">Cliente / Receptor:</span>
          <div className="flex-1 border-b border-slate-200 pb-1 font-extrabold uppercase">
            {evento.cliente_nombre} <span className="text-slate-400 font-medium ml-2">({formatPhone(evento.cliente_telefono)})</span>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <span className="font-black uppercase tracking-wider text-slate-500 w-40">Tipo de Evento:</span>
          <div className="flex-1 border-b border-slate-200 pb-1 font-bold">
            {evento.tipo_evento}
          </div>
        </div>

        <div className="flex items-end gap-4">
          <span className="font-black uppercase tracking-wider text-slate-500 w-40">Horario y Servicio:</span>
          <div className="flex-1 border-b border-slate-200 pb-1 font-bold">
            {evento.hora_inicio?.slice(0, 5)} - {evento.hora_fin?.slice(0, 5)} hrs ({evento.tiempo_servicio})
          </div>
        </div>

        <div className="flex items-end gap-4">
          <span className="font-black uppercase tracking-wider text-slate-500 w-40">Ubicacion:</span>
          <div className="flex-1 border-b border-slate-200 pb-1 font-bold truncate">
            {formatLocationName(evento.lugar_url)}
          </div>
        </div>

        <div className="flex items-end gap-4">
          <span className="font-black uppercase tracking-wider text-slate-500 w-40">Codigo de Vestimenta:</span>
          <div className="flex-1 border-b border-slate-200 pb-1 font-medium">
            {evento.codigo_vestimenta ? (evento.detalle_vestimenta || 'Aplica') : 'No especificado'}
          </div>
        </div>

        <div className="flex items-end gap-4">
          <span className="font-black uppercase tracking-wider text-slate-500 w-40">Peticion Especial:</span>
          <div className="flex-1 border-b border-slate-200 pb-1 font-medium">
            {evento.peticion_cancion ? (evento.detalle_cancion || 'Aplica') : 'Sin peticion especial'}
          </div>
        </div>

        <div className="flex items-end gap-4">
          <span className="font-black uppercase tracking-wider text-slate-500 w-40">Monto Cubierto:</span>
          <div className="flex-1 border-b border-slate-200 pb-1 font-black text-base text-[#556B2F]">
            {formatMXN(evento.anticipo_pagado)}
          </div>
        </div>

        <div className="flex items-end gap-4 pt-1">
          <span className="font-black uppercase tracking-wider text-red-600 w-40">Saldo Pendiente:</span>
          <div className="flex-1 border-b border-red-200 pb-1 font-black text-base text-red-600">
            {formatMXN(evento.saldo_liquidar)}
          </div>
        </div>
      </div>

      <div className="text-center pt-6 border-t border-slate-200 space-y-1">
        <p className="text-[11px] text-slate-500">Contacto directo: 6679404297 | Instagram: @alansax._</p>
        <p className="text-[9px] text-slate-400 italic">Comprobante oficial de servicio musical y resumen de evento.</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] pb-20 px-4 py-8 relative">
      {/* Contenedor oculto persistente con idéntica estructura visual para el generador de PDF */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '850px', background: '#fdfbf7', padding: '40px' }}>
        <div ref={reciboRef} className="bg-white text-slate-900 w-full rounded-2xl shadow-2xl border-t-[8px] border-[#556B2F] p-8 sm:p-10">
          {reciboTemplate}
        </div>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link href="/agenda" className="text-[#556B2F] font-bold hover:underline flex items-center gap-1 text-sm">
            &larr; Volver a Agenda
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowRecibo(true)}
              className="bg-[#556B2F] hover:bg-[#6B8E23] text-white font-extrabold px-4 py-2 rounded-xl text-sm transition-all shadow-md shadow-[#556B2F]/20"
            >
              Vista Previa Recibo
            </button>
            <button
              onClick={handleDescargarPDF}
              disabled={generandoPDF}
              className="bg-white hover:bg-zinc-50 text-[#2C2C2C] border border-[#E5E1D8] font-bold px-3 py-2 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
            >
              {generandoPDF ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
            <Link
              href={`/eventos/${evento._id}/editar`}
              className="bg-white hover:bg-zinc-50 text-[#2C2C2C] border border-[#E5E1D8] font-bold px-3 py-2 rounded-xl text-sm transition-all shadow-sm"
            >
              Modificar
            </Link>
            {!isLiquidado && !isCancelado && (
              <button
                onClick={handleMarcarLiquidado}
                disabled={marcandoLiquidado}
                className="bg-[#556B2F] hover:bg-[#6B8E23] text-white font-extrabold px-3 py-2 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
              >
                {marcandoLiquidado ? 'Liquidando...' : 'Marcar Liquidado'}
              </button>
            )}
          </div>
        </div>

        <div className="ig-card p-6 sm:p-8 shadow-sm relative space-y-6 border border-[#E5E1D8]">
          <div className="absolute top-6 right-6">
            {isCancelado && (
              <span className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                Cancelado
              </span>
            )}
            {isReprogramado && !isCancelado && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                Reprogramado
              </span>
            )}
            {isLiquidado && !isCancelado && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                Liquidado
              </span>
            )}
          </div>

          <div>
            <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">
              {evento.numero_evento} • {evento.tipo_evento}
            </span>
            <h2 className="text-3xl font-black text-[#2C2C2C] mt-1 tracking-tight">
              {evento.cliente_nombre}
            </h2>
          </div>

          <div className="space-y-3 bg-[#F9F7F2] p-5 rounded-2xl border border-[#E5E1D8] text-sm">
            <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
              <span className="text-zinc-500 font-semibold">Fecha</span>
              <span className="font-bold text-[#2C2C2C]">{formatDateLocal(evento.fecha_evento)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
              <span className="text-zinc-500 font-semibold">Horario</span>
              <span className="font-bold text-[#556B2F]">{evento.hora_inicio?.slice(0, 5)} - {evento.hora_fin?.slice(0, 5)} hrs ({evento.tiempo_servicio})</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
              <span className="text-zinc-500 font-semibold">Telefono</span>
              <a href={`tel:${evento.cliente_telefono}`} className="font-bold text-[#556B2F] hover:underline">
                {formatPhone(evento.cliente_telefono)}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-semibold">Ubicacion</span>
              <a href={evento.lugar_url} target="_blank" rel="noopener noreferrer" className="font-bold text-[#556B2F] hover:underline">
                Abrir en Google Maps &rarr;
              </a>
            </div>
          </div>

          <div className="bg-[#F9F7F2] p-5 rounded-2xl border border-[#E5E1D8] space-y-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Desglose Financiero</span>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div>
                <span className="block text-[10px] text-zinc-500 uppercase font-bold">Total</span>
                <span className="text-sm font-extrabold text-[#2C2C2C]">{formatMXN(evento.nuevo_precio_total)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500 uppercase font-bold">Anticipo</span>
                <span className="text-sm font-extrabold text-emerald-600">{formatMXN(evento.anticipo_pagado)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500 uppercase font-bold">Saldo</span>
                <span className={`text-sm font-extrabold ${evento.saldo_liquidar > 0 ? 'text-amber-600' : 'text-zinc-500'}`}>
                  {formatMXN(evento.saldo_liquidar)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E5E1D8]">
              <span className="block text-xs font-bold text-zinc-500 uppercase mb-1">Codigo de Vestimenta</span>
              <p className="text-[#2C2C2C] font-medium">{evento.codigo_vestimenta ? (evento.detalle_vestimenta || 'Aplica') : 'No especificado'}</p>
            </div>
            <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E5E1D8]">
              <span className="block text-xs font-bold text-zinc-500 uppercase mb-1">Peticion de Cancion</span>
              <p className="text-[#2C2C2C] font-medium">{evento.peticion_cancion ? (evento.detalle_cancion || 'Aplica') : 'Sin peticiones especiales'}</p>
            </div>
          </div>

          {evento.repertorio_setlist && (
            <div className="bg-[#F9F7F2] p-5 rounded-2xl border border-[#E5E1D8]">
              <span className="block text-xs font-bold text-[#556B2F] uppercase tracking-wider mb-2">Setlist del Show</span>
              {Array.isArray(evento.repertorio_setlist) ? (
                <div className="space-y-1.5">
                  {evento.repertorio_setlist.map((cancion: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-[#E5E1D8]">
                      <span className="font-medium text-[#2C2C2C]">{i + 1}. {cancion.name}</span>
                      <span className="font-mono text-zinc-400">
                        {Math.floor(cancion.duration / 60)}:{(cancion.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#2C2C2C] whitespace-pre-line text-sm font-mono bg-white p-3 rounded-xl border border-[#E5E1D8]">
                  {evento.repertorio_setlist}
                </p>
              )}
            </div>
          )}

          {evento.notas && (
            <div className="bg-[#F9F7F2] p-5 rounded-2xl border border-[#E5E1D8]">
              <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Notas Adicionales</span>
              <p className="text-[#2C2C2C] whitespace-pre-line text-sm">{evento.notas}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Vista Previa del Recibo */}
      {showRecibo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl relative border-t-[8px] border-[#556B2F] p-6 sm:p-10 my-8">
            
            <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
              <h3 className="text-lg font-black uppercase tracking-wider text-[#2C2C2C]">Vista Previa del Comprobante</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDescargarPDF}
                  disabled={generandoPDF}
                  className="bg-[#556B2F] hover:bg-[#6B8E23] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm disabled:opacity-50"
                >
                  {generandoPDF ? 'Generando...' : 'Descargar PDF'}
                </button>
                <button
                  onClick={() => setShowRecibo(false)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="bg-white text-slate-900 w-full rounded-2xl shadow-sm border border-zinc-100 p-6">
              {reciboTemplate}
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
