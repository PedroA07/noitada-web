import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NOITADA',
  description: 'A comunidade definitiva para gamers e corujas da madrugada.',
  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-black text-white font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}