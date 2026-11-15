import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Evento from '@/Models/Evento';
import { resolveGoogleMapsUrl } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = params;

  try {
    await connectDB();
    const evento = await Evento.findById(id);

    if (!evento) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const eventoObj = evento.toObject();
    const now = new Date();
    if (new Date(eventoObj.fecha_evento) < now && eventoObj.estado !== 'CANCELADO') {
      eventoObj.saldo_liquidar = 0;
    }

    return NextResponse.json(eventoObj);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener evento' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    await connectDB();

    const currentEvent = await Evento.findById(id);
    if (!currentEvent) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const {
      cliente_nombre,
      cliente_telefono,
      tipo_evento,
      fecha_evento,
      hora_inicio,
      hora_fin,
      lugar_url,
      tiempo_servicio,
      codigo_vestimenta,
      detalle_vestimenta,
      peticion_cancion,
      detalle_cancion,
      estado,
      precio_original,
      anticipo_pagado,
      aplica_costo_reprogramacion,
      monto_reprogramacion,
      repertorio_setlist,
      notas,
      liquidar
    } = body;

    const resolvedLugarUrl = lugar_url ? await resolveGoogleMapsUrl(lugar_url) : currentEvent.lugar_url;

    const parsedPrecioOriginal = precio_original !== undefined ? parseFloat(precio_original) : currentEvent.precio_original;
    let parsedAnticipo = anticipo_pagado !== undefined ? parseFloat(anticipo_pagado) : currentEvent.anticipo_pagado;
    const isReprogramado = estado === 'REPROGRAMADO' || currentEvent.estado === 'REPROGRAMADO';
    const isCancelado = estado === 'CANCELADO';

    const parsedMontoReprog = aplica_costo_reprogramacion !== undefined 
      ? (aplica_costo_reprogramacion ? (parseFloat(monto_reprogramacion) || 0) : 0)
      : (currentEvent.aplica_costo_reprogramacion ? currentEvent.monto_reprogramacion : 0);

    let nuevo_precio_total = parsedPrecioOriginal + parsedMontoReprog;
    
    if (liquidar) {
      parsedAnticipo = nuevo_precio_total;
    }

    let saldo_liquidar = nuevo_precio_total - parsedAnticipo;

    if (isCancelado) {
      saldo_liquidar = 0.00;
    }

    const updatedEvento = await Evento.findByIdAndUpdate(id, {
      cliente_nombre: cliente_nombre ?? currentEvent.cliente_nombre,
      cliente_telefono: cliente_telefono ?? currentEvent.cliente_telefono,
      tipo_evento: tipo_evento ?? currentEvent.tipo_evento,
      fecha_evento: fecha_evento ? new Date(fecha_evento) : currentEvent.fecha_evento,
      hora_inicio: hora_inicio ?? currentEvent.hora_inicio,
      hora_fin: hora_fin ?? currentEvent.hora_fin,
      lugar_url: resolvedLugarUrl,
      tiempo_servicio: tiempo_servicio ?? currentEvent.tiempo_servicio,
      codigo_vestimenta: codigo_vestimenta !== undefined ? Boolean(codigo_vestimenta) : currentEvent.codigo_vestimenta,
      detalle_vestimenta: detalle_vestimenta !== undefined ? detalle_vestimenta : currentEvent.detalle_vestimenta,
      peticion_cancion: peticion_cancion !== undefined ? Boolean(peticion_cancion) : currentEvent.peticion_cancion,
      detalle_cancion: detalle_cancion !== undefined ? detalle_cancion : currentEvent.detalle_cancion,
      estado: estado ?? currentEvent.estado,
      precio_original: parsedPrecioOriginal,
      anticipo_pagado: parsedAnticipo,
      aplica_costo_reprogramacion: aplica_costo_reprogramacion !== undefined ? Boolean(aplica_costo_reprogramacion) : currentEvent.aplica_costo_reprogramacion,
      monto_reprogramacion: parsedMontoReprog,
      nuevo_precio_total,
      saldo_liquidar,
      repertorio_setlist: repertorio_setlist !== undefined ? repertorio_setlist : currentEvent.repertorio_setlist,
      notas: notas !== undefined ? notas : currentEvent.notas,
    }, { new: true });

    const eventoObj = updatedEvento.toObject();
    const now = new Date();
    if (new Date(eventoObj.fecha_evento) < now && eventoObj.estado !== 'CANCELADO') {
      eventoObj.saldo_liquidar = 0;
    }

    return NextResponse.json(eventoObj);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar evento' }, { status: 500 });
  }
}
