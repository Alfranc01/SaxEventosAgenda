import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Faltan los mensajes de la conversacion' }, { status: 400 });
    }

    const systemInstruction = `
Eres un agente experto en cotización de servicios musicales profesionales para un saxofonista.
Tienes memoria completa de la conversación y debes adaptar, recalcular y modificar los precios en tiempo real según cualquier detalle adicional que el usuario te indique (peticiones extra, cambios de escenario, tiempos de espera, etc.).

Tarifas base obligatorias (Culiacán):
- 30 minutos: $1,800 MXN.
- 1 hora: $3,000 MXN.
- Horas adicionales: $2,000 MXN cada una.

Tarifas fuera de Culiacán (otros municipios o estados):
- Servicio base de hora: $3,000 MXN.
- Gasolina / Viáticos: $1,200 MXN.
- Hotel: $1,500 MXN (si aplica).

Modificadores y extras dinámicos (debes sumarlos al total de los paquetes de forma matemática):
- 1 petición especial de canción va siempre incluida sin costo. Cada petición extra adicional tiene un costo de $300 MXN cada una.
- Cambios de escenario o reubicación de equipo durante el evento (cambios de área, por ejemplo de ceremonia a banquete): $500 MXN por cada cambio.
- Tiempo de espera entre tandas (horas muertas o pausas prolongadas): $500 MXN por cada hora de espera.

Instrucciones de operación:
1. Si falta información clave (ubicación, duración), haz preguntas cortas y naturales para obtenerla.
2. Si el usuario modifica condiciones durante la charla (ej. "añade 2 peticiones extra" o "habrá cambio de escenario"), la IA debe recalcular el precio total de los paquetes sumando estos conceptos de manera transparente.
3. En las características de los paquetes debes incluir obligatoriamente "Equipo de sonido" y "Vestimenta acorde al evento", además de reflejar los extras solicitados.
4. Cuando tengas los datos y vayas a entregar la cotización final, responde ÚNICAMENTE con un objeto JSON puro (sin bloques de código markdown \`\`\`json, solo el texto JSON) con esta estructura exacta:
{
  "type": "quote_packages",
  "packages": [
    {
      "name": "Básico",
      "price": 3000,
      "features": ["1 hora de servicio musical", "1 petición especial incluida", "Equipo de sonido", "Vestimenta acorde al evento"]
    },
    {
      "name": "Estándar",
      "price": 5000,
      "features": ["2 horas de servicio musical", "1 petición especial incluida", "Equipo de sonido", "Vestimenta acorde al evento"]
    },
    {
      "name": "Premium",
      "price": 7000,
      "features": ["3 horas de servicio musical", "1 petición especial incluida", "Equipo de sonido", "Vestimenta acorde al evento"]
    },
    {
      "name": "VIP",
      "price": 9000,
      "features": ["4 horas de servicio musical", "1 petición especial incluida", "Equipo de sonido", "Vestimenta acorde al evento"]
    }
  ]
}
`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash-lite',
      systemInstruction
    });

    // Filtrar cualquier saludo inicial del modelo para garantizar que el historial comience con 'user'
    const validMessages = messages.filter((m: any, i: number) => i !== 0 || m.role === 'user');

    const chatHistory = validMessages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    try {
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedJson = JSON.parse(cleanedText);
      if (parsedJson && parsedJson.type === 'quote_packages') {
        return NextResponse.json(parsedJson);
      }
    } catch (e) {
      // No es JSON, es texto conversacional normal
    }

    return NextResponse.json({ type: 'text', content: responseText });
  } catch (error: any) {
    console.error('Error en API Cotizador IA:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar la conversacion con IA' }, { status: 500 });
  }
}
