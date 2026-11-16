import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Evento from '@/Models/Evento';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await connectDB();
    const eventos = await Evento.find({});

    let totalMesActual = 0;
    let total3Meses = 0;
    let total6Meses = 0;
    let totalAnio = 0;
    let totalAcumuladoHistorico = 0;
    let saldoObtenido = 0;
    let saldoPendiente = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    eventos.forEach((ev: any) => {
      const fechaEv = new Date(ev.fecha_evento);
      const evMonth = fechaEv.getMonth();
      const evYear = fechaEv.getFullYear();

      const precioTotal = parseFloat(ev.nuevo_precio_total) || 0;
      const anticipo = parseFloat(ev.anticipo_pagado) || 0;
      const saldoLiq = parseFloat(ev.saldo_liquidar) || 0;

      let ingresoRealEvento = 0;
      if (ev.estado === 'CANCELADO') {
        ingresoRealEvento = anticipo;
      } else {
        const pagado = precioTotal - saldoLiq;
        ingresoRealEvento = pagado > 0 ? pagado : anticipo;
      }

      saldoObtenido += ingresoRealEvento;

      if (ev.estado !== 'CANCELADO' && saldoLiq > 0) {
        saldoPendiente += saldoLiq;
      }

      totalAcumuladoHistorico += ingresoRealEvento;

      if (evYear === currentYear) {
        totalAnio += ingresoRealEvento;

        if (evMonth === currentMonth) {
          totalMesActual += ingresoRealEvento;
        }

        const diffMonths = (currentYear - evYear) * 12 + (currentMonth - evMonth);
        if (diffMonths >= 0 && diffMonths < 3) {
          total3Meses += ingresoRealEvento;
        }
        if (diffMonths >= 0 && diffMonths < 6) {
          total6Meses += ingresoRealEvento;
        }
      }
    });

    return NextResponse.json({
      totalMesActual,
      total3Meses,
      total6Meses,
      totalAnio,
      totalAcumuladoHistorico,
      saldoObtenido,
      saldoPendiente,
      eventosCount: eventos.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al calcular finanzas' }, { status: 500 });
  }
}
