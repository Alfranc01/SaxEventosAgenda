/**
 * Formatea un número como moneda local MXN ($0,000.00)
 */
export function formatMXN(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convierte y formatea fechas evitando desfases de zona horaria (UTC vs Local)
 */
export function formatDateLocal(dateInput: string | Date): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  
  return adjustedDate.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formatea la hora limpiamente evitando desfases de zona horaria y milisegundos de SQL TIME
 */
export function formatTime(timeInput: any): string {
  if (!timeInput) return '';
  if (typeof timeInput === 'string') {
    return timeInput.slice(0, 5);
  }
  if (timeInput instanceof Date) {
    const h = String(timeInput.getUTCHours()).padStart(2, '0');
    const m = String(timeInput.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  return String(timeInput).slice(0, 5);
}

/**
 * Formatea un número de teléfono al formato xxx-xxx-xxxx
 */
export function formatPhone(phoneInput: string | null | undefined): string {
  if (!phoneInput) return '';
  const cleaned = String(phoneInput).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('52')) {
    const num = cleaned.slice(2);
    if (num.length === 10) {
      return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
    }
  }
  return phoneInput;
}

/**
 * Resuelve enlaces cortos de Google Maps (goo.gl / maps.app.goo.gl) siguiendo las redirecciones con timeout de seguridad
 */
export async function resolveGoogleMapsUrl(url: string): Promise<string> {
  if (!url) return '';
  if (!url.includes('goo.gl') && !url.includes('maps.app.goo.gl')) {
    return url;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    clearTimeout(timeoutId);
    return response.url || url;
  } catch (err) {
    return url;
  }
}

/**
 * Extrae o interpreta un nombre de salón o lugar legible a partir de un enlace o texto de ubicación
 */
export function formatLocationName(input: string): string {
  if (!input) return 'Lugar no especificado';
  
  // Si no es una URL, lo retornamos tal cual (ej. nombre directo del salón).
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return input;
  }

  try {
    // Buscar en formato /place/Nombre_Del_Lugar/
    const placeMatch = input.match(/\/place\/([^/@]+)/);
    if (placeMatch && placeMatch[1]) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    // Buscar en formato /maps/search/Nombre_Del_Lugar/
    const searchMatch = input.match(/\/maps\/search\/([^/@]+)/);
    if (searchMatch && searchMatch[1]) {
      return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
    }

    // Buscar en parámetros de búsqueda q= o query=
    const urlObj = new URL(input);
    const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('query');
    if (q) {
      return decodeURIComponent(q.replace(/\+/g, ' '));
    }
  } catch (e) {
    // Si falla el parsing
  }

  return 'Lugar del Evento';
}

/**
 * Valida si hay empalme de horarios (< 1.5 horas de diferencia entre eventos del mismo día)
 */
export function checkEmpalme(
  nuevaFecha: string,
  nuevaInicio: string,
  nuevaFin: string,
  eventosExistentes: Array<{ fecha_evento: string; hora_inicio: string; hora_fin: string; estado: string }>
): { hayEmpalme: boolean; mensaje?: string } {
  const timeToMinutes = (timeStr: string) => {
    const cleanTime = formatTime(timeStr);
    const parts = cleanTime.split(':');
    return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
  };

  const nuevaInicioMin = timeToMinutes(nuevaInicio);
  const nuevaFinMin = timeToMinutes(nuevaFin);
  const bufferMinutos = 90;

  for (const ev of eventosExistentes) {
    if (ev.estado === 'CANCELADO') continue;
    
    const evFecha = new Date(ev.fecha_evento).toISOString().split('T')[0];
    const targetFecha = new Date(nuevaFecha).toISOString().split('T')[0];

    if (evFecha === targetFecha) {
      const evInicioMin = timeToMinutes(ev.hora_inicio);
      const evFinMin = timeToMinutes(ev.hora_fin);

      const gap1 = nuevaInicioMin - evFinMin;
      const gap2 = evInicioMin - nuevaFinMin;

      if ((gap1 >= 0 && gap1 < bufferMinutos) || (gap2 >= 0 && gap2 < bufferMinutos) ||
          (nuevaInicioMin >= evInicioMin && nuevaInicioMin < evFinMin) ||
          (nuevaFinMin > evInicioMin && nuevaFinMin <= evFinMin)) {
        return {
          hayEmpalme: true,
          mensaje: `Advertencia: Empalme detectado con otro evento en fecha ${targetFecha} con menos de 1.5 horas de diferencia.`
        };
      }
    }
  }

  return { hayEmpalme: false };
}
