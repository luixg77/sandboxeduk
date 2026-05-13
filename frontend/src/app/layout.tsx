import type { Metadata } from 'next';
import './globals.css';

import ReactQueryProvider from '@/providers/ReactQueryProvider';

export const metadata: Metadata = {
  title: 'Kodar — Plataforma de Aprendizagem',
  description: 'Plataforma educacional inteligente focada em SAEB e ENEM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
