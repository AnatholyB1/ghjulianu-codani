import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt     = 'Ghjulianu Codani — Photographe';
export const size    = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
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
          padding:        '80px',
          position:       'relative',
        }}
      >
        {/* Accent bar top-left */}
        <div style={{
          position:   'absolute',
          top:        0,
          left:       0,
          width:      '4px',
          height:     '100%',
          background: '#C8A97E',
          display:    'flex',
        }} />

        {/* Subtle grid texture */}
        <div style={{
          position:   'absolute',
          inset:      0,
          background: 'radial-gradient(ellipse at 70% 40%, rgba(200,169,126,0.08) 0%, transparent 65%)',
          display:    'flex',
        }} />

        {/* Label */}
        <p style={{
          fontSize:      22,
          letterSpacing: '0.22em',
          color:         '#7a7a74',
          marginBottom:  24,
          fontFamily:    'sans-serif',
          display:       'flex',
        }}>
          PHOTOGRAPHE — PARIS
        </p>

        {/* Main title */}
        <h1 style={{
          fontSize:      96,
          fontWeight:    300,
          color:         '#E8E4DC',
          lineHeight:    0.92,
          marginBottom:  40,
          fontFamily:    'serif',
          fontStyle:     'italic',
          display:       'flex',
        }}>
          Ghjulianu Codani
        </h1>

        {/* Sub */}
        <p style={{
          fontSize:      22,
          color:         '#7a7a74',
          letterSpacing: '0.06em',
          fontFamily:    'sans-serif',
          display:       'flex',
        }}>
          Shooting personnel · Marques · Événementiel nightlife
        </p>

        {/* URL */}
        <p style={{
          position:      'absolute',
          bottom:        40,
          right:         80,
          fontSize:      18,
          color:         '#C8A97E',
          letterSpacing: '0.1em',
          fontFamily:    'sans-serif',
          display:       'flex',
        }}>
          ghjulianucodani.com
        </p>
      </div>
    ),
    { ...size },
  );
}
