import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini-Aternos | Minecraft Server Control Panel',
  description:
    'Personal Minecraft server control panel. Spin up and tear down DigitalOcean VPS on demand. Pay only when playing.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 antialiased">{children}</body>
    </html>
  );
}
