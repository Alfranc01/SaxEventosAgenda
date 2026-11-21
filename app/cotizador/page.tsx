'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatMXN } from '@/lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
  packages?: any[];
}

export default function CotizadorAIPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Hola. Soy tu asistente virtual de cotizaciones. ¿Qué tipo de evento tienes en mente y en qué fecha o lugar se llevará a cabo?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/cotizador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al comunicarse con el asistente');
      }

      if (data.type === 'quote_packages') {
        setMessages([
          ...updatedMessages,
          {
            role: 'model',
            content: 'He analizado los detalles de tu evento. Aquí tienes las opciones de paquetes diseñadas especialmente para ti:',
            packages: data.packages
          }
        ]);
      } else {
        setMessages([
          ...updatedMessages,
          {
            role: 'model',
            content: data.content || 'Entendido. ¿Podrías darme más detalles?'
          }
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPaquete = (pkg: any) => {
    const queryParams = new URLSearchParams({
      tipo: 'Boda',
      precio: pkg.price.toString(),
      anticipo: (pkg.price * 0.5).toString(),
      notas: `Paquete ${pkg.name}: ${pkg.features.join(', ')}`
    });
    router.push(`/eventos/nuevo?${queryParams.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] pb-24 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <Link href="/agenda" className="text-[#556B2F] font-bold hover:underline flex items-center gap-1 text-sm">
            &larr; Volver a Agenda
          </Link>
          <div className="h-8 flex items-center">
            <img src="/logo.svg" alt="alansax" className="h-full object-contain" />
          </div>
        </div>

        {/* Contenedor del Chat */}
        <div className="ig-card p-6 sm:p-8 shadow-sm border border-[#E5E1D8] flex flex-col h-[70vh]">
          
          <div className="border-b border-[#E5E1D8] pb-4 mb-4">
            <h1 className="text-xl font-black text-[#2C2C2C] tracking-tight">Asistente Virtual de Cotizaciones</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Conversa con el agente para definir tu evento y obtener propuestas de paquetes automatizadas.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs font-medium mb-4">
              {error}
            </div>
          )}

          {/* Historial de Mensajes */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#556B2F] text-white rounded-br-none shadow-md'
                      : 'bg-[#F9F7F2] text-[#2C2C2C] border border-[#E5E1D8] rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Renderizado de Tarjetas de Precios si la IA devolvió paquetes */}
                {msg.packages && (
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {msg.packages.map((pkg, pIdx) => (
                      <div
                        key={pIdx}
                        className="bg-white border border-[#E5E1D8] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#556B2F] transition-all"
                      >
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-[#556B2F] uppercase tracking-widest bg-[#F9F7F2] px-2.5 py-1 rounded-full border border-[#E5E1D8]">
                            {pkg.name}
                          </span>
                          <div className="text-2xl font-black text-[#2C2C2C]">
                            {formatMXN(pkg.price)}
                          </div>
                          <ul className="space-y-2 text-xs text-zinc-600 pt-2 border-t border-[#E5E1D8]">
                            {pkg.features.map((feat: string, fIdx: number) => (
                              <li key={fIdx} className="flex items-start gap-2">
                                <span className="text-[#556B2F] font-bold">-</span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          onClick={() => seleccionarPaquete(pkg)}
                          className="w-full py-2.5 px-3 bg-[#556B2F] hover:bg-[#6B8E23] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
                        >
                          Seleccionar paquete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#F9F7F2] text-zinc-500 border border-[#E5E1D8] rounded-2xl px-4 py-3 text-xs italic">
                  El asistente está escribiendo...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Entrada */}
          <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-[#E5E1D8] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje o responde al asistente..."
              className="flex-1 ig-input px-4 py-3 text-sm placeholder-zinc-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#556B2F] hover:bg-[#6B8E23] text-white font-extrabold px-6 py-3 rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
            >
              Enviar
            </button>
          </form>

        </div>

      </div>
    </main>
  );
}
