import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportarDocumentoProyectoPDF() {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.padding = '40px';
  container.style.backgroundColor = '#FDFBF7';
  container.style.color = '#2C2C2C';
  container.style.fontFamily = 'sans-serif';
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.5';

  container.innerHTML = `
    <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 8px; color: #2C2C2C;">MI AGENDA - DOCUMENTACION DEL PROYECTO</h1>
    <p style="font-size: 14px; font-weight: bold; color: #556B2F; margin-bottom: 24px;">Equipo: AgendaS | Integrantes: Alan Franco Moraila y Angel Fernando Sandoval Rodriguez</p>
    
    <h2 style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #556B2F; padding-bottom: 4px; margin-top: 16px;">1. Descripcion General</h2>
    <p>Mi Agenda es una aplicación web profesional de gestión de eventos y control financiero para la administración integral de servicios profesionales.</p>

    <h2 style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #556B2F; padding-bottom: 4px; margin-top: 16px;">2. Arquitectura y Estructura Frontend</h2>
    <pre style="background: #F9F7F2; padding: 12px; border: 1px solid #E5E1D8; border-radius: 8px; font-size: 10px;">
src/
├── assets/          # Imagenes, fuentes, iconos y archivos estaticos
├── components/      # Componentes de interfaz reutilizables
├── config/          # Variables de entorno y configuraciones
├── features/        # Modulos del negocio (auth, profile)
├── hooks/           # Funciones reutilizables
├── services/        # Conexiones a APIs y fetch
├── store/           # Estado global
├── utils/           # Funciones auxiliares puras
└── App.js           # Punto de entrada principal
    </pre>

    <h2 style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #556B2F; padding-bottom: 4px; margin-top: 16px;">3. Organizacion del Equipo</h2>
    <p><b>Alan Franco Moraila:</b> Idea principal, interfaz de usuario (Lujo Organico), vistas de agenda, gestor multimedia MP3 y recibos PDF.</p>
    <p><b>Angel Fernando Sandoval Rodriguez:</b> Arquitectura del sistema, modelado en MongoDB Atlas, autenticacion segura y logica de backend.</p>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FDFBF7'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('MiAgenda_Documentacion_Proyecto.pdf');
  } catch (err) {
    console.error('Error al generar PDF:', err);
  } finally {
    document.body.removeChild(container);
  }
}
