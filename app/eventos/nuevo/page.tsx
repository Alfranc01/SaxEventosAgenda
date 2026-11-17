'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TimeSelector from '@/components/ui/TimeSelector';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function NuevoEventoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [advertenciaEmpalme, setAdvertenciaEmpalme] = useState('');

  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    tipo_evento: 'Boda',
    fecha_evento: '',
    hora_inicio: '18:00',
    hora_fin: '20:00',
    lugar_url: '',
    tiempo_servicio: '2 horas',
    codigo_vestimenta: false,
    detalle_vestimenta: '',
    peticion_cancion: false,
    detalle_cancion: '',
    precio_original: '',
    anticipo_pagado: '',
    aplica_costo_reprogramacion: false,
    monto_reprogramacion: '',
    notas: '',
  });

  const [setlist, setSetlist] = useState<{ name: string; duration: number }[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newSongs: { name: string; duration: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/')) continue;

      try {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        
        await new Promise((resolve) => {
          audio.onloadedmetadata = () => resolve(audio.duration);
        });

        newSongs.push({
          name: file.name.replace(/\\.(mp3|wav|ogg)$/i, ''),
          duration: Math.round(audio.duration),
        });
      } catch (err) {
        console.error(`Error reading file ${file.name}:`, err);
      }
    }

    setSetlist(prev => [...prev, ...newSongs]);
  };

  const removeSong = (index: number) => {
    setSetlist(prev => prev.filter((_, i) => i !== index));
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(setlist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSetlist(items);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = setlist.reduce((acc, song) => acc + song.duration, 0);

  const verificarEmpalme = async (fecha: string, inicio: string, fin: string) => {
    if (!fecha || !inicio || !fin) return;
    try {
      const res = await fetch('/api/validaciones/empalmes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_evento: fecha, hora_inicio: inicio, hora_fin: fin }),
      });
      const data = await res.json();
      if (data.hayEmpalme) {
        setAdvertenciaEmpalme(data.mensaje);
      } else {
        setAdvertenciaEmpalme('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, repertorio_setlist: setlist }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar evento');
      }

      router.push('/agenda');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] pb-20 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/agenda"
            className="text-[#556B2F] font-bold hover:underline flex items-center gap-1 text-sm"
          >
            &larr; Volver a Agenda
          </Link>
          <div className="h-8 flex items-center">
            <img src="/logo.svg" alt="alansax" className="h-full object-contain" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        {advertenciaEmpalme && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-2xl text-sm mb-6 flex items-center gap-2 font-medium">
            <span>⚠️</span>
            <span>{advertenciaEmpalme}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="ig-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#E5E1D8] pb-2">1. Información del Cliente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Nombre del Cliente *</label>
                <input
                  type="text"
                  name="cliente_nombre"
                  required
                  value={formData.cliente_nombre}
                  onChange={handleChange}
                  className="w-full ig-input px-4 py-3.5 text-sm placeholder-zinc-400"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Teléfono *</label>
                <input
                  type="text"
                  name="cliente_telefono"
                  required
                  value={formData.cliente_telefono}
                  onChange={handleChange}
                  className="w-full ig-input px-4 py-3.5 text-sm placeholder-zinc-400"
                  placeholder="Ej. 5512345678"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#E5E1D8] pb-2">2. Fecha, Horario y Lugar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Tipo de Evento *</label>
                <select
                  name="tipo_evento"
                  value={formData.tipo_evento}
                  onChange={handleChange}
                  className="w-full ig-input px-4 py-3.5 text-sm font-bold"
                >
                  <option value="Boda" className="bg-[#FDFBF7]">Boda</option>
                  <option value="Ceremonia" className="bg-[#FDFBF7]">Ceremonia</option>
                  <option value="XV Años" className="bg-[#FDFBF7]">XV Años</option>
                  <option value="Baby Shower" className="bg-[#FDFBF7]">Baby Shower</option>
                  <option value="Corporativo" className="bg-[#FDFBF7]">Corporativo</option>
                  <option value="Cumpleaños" className="bg-[#FDFBF7]">Cumpleaños</option>
                  <option value="Otro" className="bg-[#FDFBF7]">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Fecha del Evento *</label>
                <input
                  type="date"
                  name="fecha_evento"
                  required
                  value={formData.fecha_evento}
                  onChange={handleChange}
                  onBlur={() => verificarEmpalme(formData.fecha_evento, formData.hora_inicio, formData.hora_fin)}
                  className="w-full ig-input px-4 py-3.5 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <TimeSelector
                  label="Hora Inicio *"
                  value={formData.hora_inicio}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, hora_inicio: val }));
                    verificarEmpalme(formData.fecha_evento, val, formData.hora_fin);
                  }}
                />
              </div>
              <div>
                <TimeSelector
                  label="Hora Fin *"
                  value={formData.hora_fin}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, hora_fin: val }));
                    verificarEmpalme(formData.fecha_evento, formData.hora_inicio, val);
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Tiempo de Servicio *</label>
                <input
                  type="text"
                  name="tiempo_servicio"
                  required
                  value={formData.tiempo_servicio}
                  onChange={handleChange}
                  placeholder="Ej. 2 horas"
                  className="w-full ig-input px-4 py-3.5 text-sm placeholder-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">URL de Google Maps (Lugar) *</label>
              <input
                type="url"
                name="lugar_url"
                required
                value={formData.lugar_url}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                className="w-full ig-input px-4 py-3.5 text-sm placeholder-zinc-400"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#E5E1D8] pb-2">3. Requerimientos Especiales</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="codigo_vestimenta"
                  checked={formData.codigo_vestimenta}
                  onChange={handleChange}
                  className="w-5 h-5 accent-[#556B2F] rounded"
                />
                <span className="font-medium text-sm text-[#2C2C2C]">¿Aplica Código de Vestimenta?</span>
              </label>
              {formData.codigo_vestimenta && (
                <input
                  type="text"
                  name="detalle_vestimenta"
                  value={formData.detalle_vestimenta}
                  onChange={handleChange}
                  placeholder="Ej. Smoking negro / Etiqueta"
                  className="w-full ig-input px-4 py-3 text-sm placeholder-zinc-400"
                />
              )}
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="peticion_cancion"
                  checked={formData.peticion_cancion}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      peticion_cancion: checked,
                      detalle_cancion: checked && !prev.detalle_cancion ? 'Por definir' : prev.detalle_cancion
                    }));
                  }}
                  className="w-5 h-5 accent-[#556B2F] rounded"
                />
                <span className="font-medium text-sm text-[#2C2C2C]">¿Petición Especial de Canción?</span>
              </label>
              {formData.peticion_cancion && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="detalle_cancion"
                    value={formData.detalle_cancion}
                    onChange={handleChange}
                    placeholder="Ej. Por definir"
                    className="w-full ig-input px-4 py-3 text-sm placeholder-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, detalle_cancion: 'Por definir' }))}
                    className="px-3 py-2 bg-white border border-[#E5E1D8] text-xs font-bold rounded-xl text-[#556B2F] hover:bg-zinc-50 transition-all whitespace-nowrap"
                  >
                    Por definir
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#E5E1D8] pb-2">4. Finanzas (MXN)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Precio Original ($ MXN) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="precio_original"
                  required
                  value={formData.precio_original}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full ig-input px-4 py-3.5 text-sm placeholder-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Anticipo Pagado ($ MXN) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="anticipo_pagado"
                  required
                  value={formData.anticipo_pagado}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full ig-input px-4 py-3.5 text-sm placeholder-zinc-400"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#E5E1D8] pb-2">5. Show & Repertorio</h2>
            
            <div className="bg-[#F9F7F2] p-5 rounded-2xl border border-[#E5E1D8] space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Setlist (Carga MP3)</label>
                <span className="text-xs font-bold text-[#556B2F] bg-white px-2 py-1 rounded-lg border border-[#E5E1D8]">
                  Total: {formatDuration(totalDuration)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-dashed border-[#E5E1D8] px-4 py-3 rounded-xl cursor-pointer hover:bg-white/50 transition-all text-sm text-zinc-500 font-medium">
                  <span>📁 Seleccionar MP3s</span>
                  <input type="file" multiple accept="audio/*" className="hidden" onChange={handleFileUpload} />
                </label>
                <button 
                  type="button" 
                  onClick={() => setSetlist([])}
                  className="px-3 py-3 bg-white border border-[#E5E1D8] text-zinc-400 hover:text-red-500 rounded-xl text-xs transition-all"
                >
                  Limpiar
                </button>
              </div>

              {setlist.length > 0 && (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="setlist">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mt-4">
                        {setlist.map((song, index) => (
                          <Draggable key={`${song.name}-${index}`} draggableId={`${song.name}-${index}`} index={index}>
                            {(provided) => (
                              <div 
                                ref={provided.innerRef} 
                                {...provided.draggableProps} 
                                {...provided.dragHandleProps}
                                className="flex items-center justify-between p-3 bg-white border border-[#E5E1D8] rounded-xl text-sm shadow-sm group"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <span className="text-zinc-300 font-mono text-xs">{index + 1}.</span>
                                  <span className="font-medium truncate">{song.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-zinc-400 font-mono">{formatDuration(song.duration)}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => removeSong(index)}
                                    className="text-zinc-300 hover:text-red-500 transition-colors"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Notas Adicionales</label>
              <textarea
                name="notas"
                rows={2}
                value={formData.notas}
                onChange={handleChange}
                placeholder="Instrucciones de estacionamiento, contacto de staff..."
                className="w-full ig-input px-4 py-3 text-sm placeholder-zinc-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-[#556B2F] hover:bg-[#6B8E23] text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Guardando Evento...' : 'Agendar Evento'}
          </button>
        </form>
      </div>
    </main>
  );
}
