import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Evento from '@/Models/Evento';
import { checkEmpalme, resolveGoogleMapsUrl } from '@/lib/utils';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const estado = searchParams.get('estado') || '';
  const historico = searchParams.get('historico') || '';

  try {
    await connectDB();
    
    let filter: any = {};
    if (search) {
      filter.$or = [
        { cliente_nombre: { $regex: search, $options: 'i' } },
        { tipo_evento: { $regex: search, $options: 'i' } },
        { numero_evento: { $regex: search, $options: 'i' } }
      ];
    }
    if (estado) {
      filter.estado = estado;
    }
    if (historico === 'true') {
      filter.fecha_evento = { $lt: new Date() };
    } else if (historico === 'false') {
      filter.fecha_evento = { $gte: new Date() };
    }

    const eventos = await Evento.find(filter).sort({ fecha_evento: 1, hora_inicio: 1 });
    const now = new Date();
    const processedEventos = eventos.map((ev: any) => {
      const evObj = ev.toObject ? ev.toObject() : ev;
      const evDate = new Date(evObj.fecha_evento);
      if (evDate < now && evObj.estado !== 'CANCELADO') {
        evObj.saldo_liquidar = 0;
      }
      return evObj;
    });
    return NextResponse.json(processedEventos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener eventos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
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
      precio_original,
      anticipo_pagado,
      aplica_costo_reprogramacion,
      monto_reprogramacion,
      repertorio_setlist,
      notas
    } = body;

    await connectDB();

    const resolvedLugarUrl = await resolveGoogleMapsUrl(lugar_url);

    // Validar empalmes de horario (menos de 1.5 horas)
    const existingEvents = await Evento.find({});
    const empalmeCheck = checkEmpalme(fecha_evento, hora_inicio, hora_fin, existingEvents);

    // Cálculos financieros
    const parsedPrecioOriginal = parseFloat(precio_original) || 0;
    const parsedAnticipo = parseFloat(anticipo_pagado) || 0;
    const parsedMontoReprog = aplica_costo_reprogramacion ? (parseFloat(monto_reprogramacion) || 0) : 0;
    
    const nuevo_precio_total = parsedPrecioOriginal + parsedMontoReprog;
    const saldo_liquidar = nuevo_precio_total - parsedAnticipo;

    // Generar numero_evento único (ej. EVT-2026-001)
    const count = await Evento.countDocuments();
    const nextNum = count + 1;
    const numero_evento = `EVT-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;

    const nuevoEvento = new Evento({
      numero_evento,
      cliente_nombre,
      cliente_telefono,
      tipo_evento,
      fecha_evento: new Date(fecha_evento),
      hora_inicio,
      hora_fin,
      lugar_url: resolvedLugarUrl,
      tiempo_servicio,
      codigo_vestimenta: Boolean(codigo_vestimenta),
      detalle_vestimenta,
      peticion_cancion: Boolean(peticion_cancion),
      detalle_cancion,
      precio_original: parsedPrecioOriginal,
      anticipo_pagado: parsedAnticipo,
      aplica_costo_reprogramacion: Boolean(aplica_costo_reprogramacion),
      monto_reprogramacion: parsedMontoReprog,
      nuevo_precio_total,
      saldo_liquidar,
      repertorio_setlist,
      notas
    });

    const savedEvento = await nuevoEvento.save();

    return NextResponse.json({
      success: true,
      id: savedEvento._id,
      numero_evento,
      advertenciaEmpalme: empalmeCheck.hayEmpalme ? empalmeCheck.mensaje : null
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear evento' }, { status: 500 });
  }
}
