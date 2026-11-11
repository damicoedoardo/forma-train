import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Forma',
    short_name: 'Forma',
    description: 'Your training, planned by a coach that follows how it goes.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0D0E12',
    theme_color: '#0D0E12',
    categories: ['health', 'fitness'],
    icons: [
      { src: '/weave-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/weave-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/weave-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
