import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { ServiceWorker } from '@/platform/pwa/ServiceWorker';
import { ViewportHeal } from '@/platform/pwa/ViewportHeal';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forma',
  description: 'Your training, planned by a coach that follows how it goes.',
  applicationName: 'Forma',
  appleWebApp: { capable: true, title: 'Forma', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0D0E12',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Inter+Tight:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <ServiceWorker />
        <ViewportHeal />
      </body>
    </html>
  );
}
