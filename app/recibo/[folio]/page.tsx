'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { formatMXN, formatDateLocal, formatLocationName, formatPhone } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReciboPublicoPage() {
  const params = useParams();
  const folio = params?.folio;

  const [loading, setLoading] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');
  const [evento, setEvento] = useState<any>(null);

  const reciboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!folio) return;
    
    fetch(`/api/eventos?search=${folio}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setEvento(data[0]);
        } else {
          setError('El recibo solicitado no existe o el folio es incorrecto.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar el recibo.');
        setLoading(false);
      });
  }, [folio]);

  const descargarPDF = async () => {
    if (!reciboRef.current) return;
    setDescargando(true);
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
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setDescargando(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-pulse text-slate-500 font-medium">Cargando comprobante...</div>
    </div>
  );

  if (error || !evento) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Comprobante no encontrado</h1>
        <p className="text-slate-500">{error || 'No pudimos localizar la informacion del evento.'}</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end gap-3 mb-6 print:hidden">
          <button 
            onClick={descargarPDF} 
            disabled={descargando}
            className="bg-[#556B2F] text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md hover:bg-[#6B8E23] transition-all disabled:opacity-50"
          >
            {descargando ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
          <button 
            onClick={() => window.print()} 
            className="bg-white border border-[#E5E1D8] text-[#2C2C2C] font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:bg-zinc-50 transition-all"
          >
            Imprimir
          </button>
        </div>

        <div ref={reciboRef} className="bg-white shadow-md border-t-[8px] border-[#556B2F] p-8 sm:p-12 rounded-sm text-slate-900 space-y-6">
          <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6">
            <div className="flex items-center gap-4">
              <img src="/logo-dark.svg" alt="alansax" className="h-14 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">Alan Franco Moraila</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Servicios Musicales de Saxofon Profesional</p>
              </div>
            </div>
            <div className="text-right bg-[#F9F7F2] border border-[#E5E1D8] px-4 py-3 rounded-xl shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#556B2F] mb-0.5">Folio de Control</div>
              <div className="text-2xl font-mono font-black text-[#2C2C2C] tracking-wider whitespace-nowrap">
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
              <span className="font-black uppercase tracking-wider text-slate-500 w-40">Vestimenta / Peticion:</span>
              <div className="flex-1 border-b border-slate-200 pb-1 font-medium">
                {evento.codigo_vestimenta ? (evento.detalle_vestimenta || 'Vestimenta requerida') : 'Sin requerimiento especial'} 
                {evento.peticion_cancion ? ` | Cancion: ${evento.detalle_cancion || 'Solicitada'}` : ''}
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
      </div>
    </main>
  );
}
