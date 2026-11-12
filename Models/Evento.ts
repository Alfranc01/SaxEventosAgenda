import mongoose from 'mongoose';

const EventoSchema = new mongoose.Schema({
  numero_evento: { type: String, required: true, unique: true },
  cliente_nombre: { type: String, required: true },
  cliente_telefono: { type: String, required: true },
  tipo_evento: { type: String, required: true },
  fecha_evento: { type: Date, required: true },
  hora_inicio: { type: String, required: true },
  hora_fin: { type: String, required: true },
  lugar_url: { type: String, required: true },
  tiempo_servicio: { type: String, required: true },
  codigo_vestimenta: { type: Boolean, default: false },
  detalle_vestimenta: String,
  peticion_cancion: { type: Boolean, default: false },
  detalle_cancion: String,
  estado: { 
    type: String, 
    enum: ['AGENDADO', 'REPROGRAMADO', 'CANCELADO'], 
    default: 'AGENDADO' 
  },
  precio_original: { type: Number, required: true },
  anticipo_pagado: { type: Number, default: 0 },
  aplica_costo_reprogramacion: { type: Boolean, default: false },
  monto_reprogramacion: { type: Number, default: 0 },
  nuevo_precio_total: { type: Number, required: true },
  saldo_liquidar: { type: Number, required: true },
  repertorio_setlist: {
    type: [
      {
        name: { type: String, required: true },
        duration: { type: Number, required: true },
      },
    ],
    default: [],
  },
  notas: String,
}, { timestamps: true });

export default mongoose.models.Evento || mongoose.model('Evento', EventoSchema);
