import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'Ghjulianu Codani — Photographe',
    short_name:       'Ghjulianu C.',
    description:      'Portfolio de Ghjulianu Codani – Shooting personnel, marques & événementiel nightlife.',
    start_url:        '/',
    display:          'standalone',
    background_color: '#080808',
    theme_color:      '#080808',
    orientation:      'portrait-primary',
    categories:       ['photography', 'portfolio'],
    lang:             'fr',
    icons: [
      {
        src:     '/icon.svg',
        sizes:   'any',
        type:    'image/svg+xml',
        purpose: 'any',
      },
      {
        src:     '/icon.svg',
        sizes:   'any',
        type:    'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name:        'Portfolio',
        url:         '/portfolio',
        description: 'Voir le portfolio photo',
      },
      {
        name:        'Albums',
        url:         '/albums',
        description: 'Parcourir les albums',
      },
      {
        name:        'Me contacter',
        url:         '/contact',
        description: 'Prendre contact',
      },
    ],

  };
}
