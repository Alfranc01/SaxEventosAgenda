'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import TimeSelector from '@/components/ui/TimeSelector';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function EditarEventoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [evento, setEvento] = useState<any>(null);
  const [setlist, setSetlist] = useState<{ name: string; duration: number }[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/eventos/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setEvento(data);
          // Cargar el setlist existente si es un array
          if (Array.isArray(data.repertorio_setlist)) {
            setSetlist(data.repertorio_setlist);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Error al cargar evento');
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setEvento((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setEvento((prev: any) => ({ ...prev, [name]: value }));
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/eventos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...evento, repertorio_setlist: setlist }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');

      router.push(`/eventos/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] flex items-center justify-center">Cargando...</div>;
  if (error || !evento) return <div className="min-h-screen bg-[#FDFBF7] text-red-600 flex items-center justify-center">{error || 'No encontrado'}</div>;

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] pb-20 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/eventos/${id}`} className="text-[#556B2F] font-bold hover:underline flex items-center gap-1 text-sm">
            &larr; Volver a Detalles
          </Link>
          <h1 className="text-xl font-black text-[#2C2C2C]">Modificar Evento</h1>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm mb-6">{error}</div>}

        <form onSubmit={handleUpdate} className="ig-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#F9F7F2] p-4 rounded-2xl border border-[#E5E1D8]">
            <div>
              <span className="text-xs font-bold text-[#556B2F] uppercase tracking-wider">{evento.numero_evento}</span>
              <h2 className="text-xl font-black text-[#2C2C2C]">{evento.cliente_nombre}</h2>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-zinc-500 mb-1">Estado Logístico</label>
              <select
                name="estado"
                value={evento.estado}
                onChange={handleChange}
                className="ig-input px-3 py-2 font-bold text-sm"
              >
                <option value="AGENDADO">AGENDADO</option>
                <option value="REPROGRAMADO">REPROGRAMADO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#E5E1D8] pb-2">Información General</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Tipo de Evento</label>
                <select
                  name="tipo_evento"
                  value={evento.tipo_evento}
                  onChange={handleChange}
                  className="w-full ig-input px-4 py-3 text-sm font-bold"
                >
                  <option value="Boda">Boda</option>
                  <option value="Ceremonia">Ceremonia</option>
                  <option value="XV Años">XV Años</option>
                  <option value="Baby Shower">Baby Shower</option>
                  <option value="Corporativo">Corporativo</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Cliente</label>
                <input
                  type="text"
                  name="cliente_nombre"
                  value={evento.cliente_nombre}
                  onChange={handleChange}
                  className="w-full ig-input px-4 py-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-zinc-500 mb-1">Teléfono</label>
              <input
                type="text"
                name="cliente_telefono"
                value={evento.cliente_telefono}
                onChange={handleChange}
                className="w-full ig-input px-4 py-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Fecha del Evento</label>
                <input
                  type="date"
                  name="fecha_evento"
                  value={evento.fecha_evento ? evento.fecha_evento.split('T')[0] : ''}
                  onChange={handleChange}
                  className="w-full ig-input px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Lugar (Google Maps URL)</label>
                <input
                  type="url"
                  name="lugar_url"
                  value={evento.lugar_url}
                  onChange={handleChange}
                  className="w-full ig-input px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <div className="w-1/2">
                  <TimeSelector
                    label="Hora Inicio"
                    value={evento.hora_inicio}
                    onChange={(val) => setEvento((prev: any) => ({ ...prev, hora_inicio: val }))}
                  />
                </div>
                <div className="w-1/2">
                  <TimeSelector
                    label="Hora Fin"
                    value={evento.hora_fin}
                    onChange={(val) => setEvento((prev: any) => ({ ...prev, hora_fin: val }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Tiempo de Servicio</label>
                <input
                  type="text"
                  name="tiempo_servicio"
                  value={evento.tiempo_servicio}
                  onChange={handleChange}
                  className="w-full ig-input px-4 py-3 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-[#F9F7F2] p-4 rounded-2xl border border-[#E5E1D8]">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#E5E1D8] pb-2">Finanzas y Reprogramación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Precio Original ($ MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  name="precio_original"
                  value={evento.precio_original}
                  onChange={handleChange}
                  className="w-full ig-input px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Anticipo Pagado ($ MXN)</label>
                <input
                  type="number"
                  step="0.01"
                  name="anticipo_pagado"
                  value={evento.anticipo_pagado}
                  onChange={handleChange}
                  className="w-full ig-input px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="aplica_costo_reprogramacion"
                  checked={evento.aplica_costo_reprogramacion}
                  onChange={handleChange}
                  className="w-5 h-5 accent-[#556B2F] rounded"
                />
                <span className="font-medium text-sm text-[#2C2C2C]">¿Aplicar Costo Extra por Reprogramación?</span>
              </label>
              {evento.aplica_costo_reprogramacion && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Monto Extra ($ MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monto_reprogramacion"
                    value={evento.monto_reprogramacion}
                    onChange={handleChange}
                    className="w-full ig-input px-4 py-3 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#E5E1D8] pb-2">Requerimientos Especiales</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="codigo_vestimenta"
                  checked={evento.codigo_vestimenta || false}
                  onChange={handleChange}
                  className="w-5 h-5 accent-[#556B2F] rounded"
                />
                <span className="font-medium text-sm text-[#2C2C2C]">Aplica Codigo de Vestimenta</span>
              </label>
              {evento.codigo_vestimenta && (
                <input
                  type="text"
                  name="detalle_vestimenta"
                  value={evento.detalle_vestimenta || ''}
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
                  checked={evento.peticion_cancion || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEvento((prev: any) => ({
                      ...prev,
                      peticion_cancion: checked,
                      detalle_cancion: checked && !prev.detalle_cancion ? 'Por definir' : prev.detalle_cancion
                    }));
                  }}
                  className="w-5 h-5 accent-[#556B2F] rounded"
                />
                <span className="font-medium text-sm text-[#2C2C2C]">Peticion Especial de Cancion</span>
              </label>
              {evento.peticion_cancion && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="detalle_cancion"
                    value={evento.detalle_cancion || ''}
                    onChange={handleChange}
                    placeholder="Ej. Por definir"
                    className="w-full ig-input px-4 py-3 text-sm placeholder-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setEvento((prev: any) => ({ ...prev, detalle_cancion: 'Por definir' }))}
                    className="px-3 py-2 bg-white border border-[#E5E1D8] text-xs font-bold rounded-xl text-[#556B2F] hover:bg-zinc-50 transition-all whitespace-nowrap"
                  >
                    Por definir
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#E5E1D8] pb-2">🎵 Módulo de Setlist</h3>
            
            <div className="bg-[#F9F7F2] p-5 rounded-2xl border border-[#E5E1D8] space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Repertorio (Carga MP3)</label>
                <span className="text-xs font-bold text-[#556B2F] bg-white px-2 py-1 rounded-lg border border-[#E5E1D8]">
                  Total: {formatDuration(totalDuration)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-dashed border-[#E5E1D8] px-4 py-3 rounded-xl cursor-pointer hover:bg-white/50 transition-all text-sm text-zinc-500 font-medium">
                  <span>📁 Añadir MP3s</span>
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
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-[#E5E1D8] pb-2">Notas</h3>
            <textarea
              name="notas"
              rows={3}
              value={evento.notas || ''}
              onChange={handleChange}
              className="w-full ig-input px-4 py-3 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 px-4 bg-[#556B2F] hover:bg-[#6B8E23] text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </main>
  );
}
