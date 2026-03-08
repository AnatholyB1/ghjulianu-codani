import { ImageResponse } from 'next/og';

export const runtime     = 'edge';
export const alt         = 'Ghjulianu Codani — Photographe';
export const size        = { width: 1200, height: 600 };
export const contentType = 'image/png';

// Reuse the same design as the OG image (Twitter prefers 2:1 ratio)
export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background:     '#080808',
          width:          '100%',
          height:         '100%',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'flex-start',
          justifyContent: 'flex-end',
          padding:        '70px',
          position:       'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#C8A97E', display: 'flex' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 40%, rgba(200,169,126,0.08) 0%, transparent 65%)', display: 'flex' }} />
        <p style={{ fontSize: 20, letterSpacing: '0.22em', color: '#7a7a74', marginBottom: 20, fontFamily: 'sans-serif', display: 'flex' }}>
          PHOTOGRAPHE — PARIS
        </p>
        <h1 style={{ fontSize: 88, fontWeight: 300, color: '#E8E4DC', lineHeight: 0.92, marginBottom: 36, fontFamily: 'serif', fontStyle: 'italic', display: 'flex' }}>
          Ghjulianu Codani
        </h1>
        <p style={{ fontSize: 20, color: '#7a7a74', letterSpacing: '0.06em', fontFamily: 'sans-serif', display: 'flex' }}>
          Shooting personnel · Marques · Événementiel nightlife
        </p>
        <p style={{ position: 'absolute', bottom: 36, right: 70, fontSize: 16, color: '#C8A97E', letterSpacing: '0.1em', fontFamily: 'sans-serif', display: 'flex' }}>
          ghjulianucodani.com
        </p>
      </div>
    ),
    { ...size },
  );
}
