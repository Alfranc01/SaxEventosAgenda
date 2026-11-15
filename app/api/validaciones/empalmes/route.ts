import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Evento from '@/Models/Evento';
import { checkEmpalme } from '@/lib/utils';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { fecha_evento, hora_inicio, hora_fin } = await request.json();

    if (!fecha_evento || !hora_inicio || !hora_fin) {
      return NextResponse.json({ error: 'Faltan parámetros de fecha u hora' }, { status: 400 });
    }

    await connectDB();
    const eventos = await Evento.find({}, 'fecha_evento hora_inicio hora_fin estado');
    
    const validacion = checkEmpalme(fecha_evento, hora_inicio, hora_fin, eventos);

    return NextResponse.json(validacion);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al validar empalmes' }, { status: 500 });
  }
}
