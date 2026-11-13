import './globals.css';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Sax Agenda',
  description: 'Gestión privada de agenda y finanzas para saxofonista freelance',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SaxAgenda',
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#FDFBF7] text-[#2C2C2C] min-h-screen">
        {children}
      </body>
    </html>
  );
}
