'use client';

import ScrollReveal from '@/components/ScrollReveal';
import Link         from 'next/link';
import { useT }     from '@/hooks/useT';

const btnBase: React.CSSProperties = {
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  gap:            '0.6rem',
  padding:        '1rem 2rem',
  fontSize:       '0.68rem',
  letterSpacing:  '0.15em',
  textDecoration: 'none',
  fontWeight:     500,
  transition:     'opacity 0.25s, transform 0.2s',
  cursor:         'pointer',
  border:         'none',
};

/** Wraps matching substrings with an accent <span>. Case-insensitive. */
function Hilite({ text, words }: { text: string; words: string[] }) {
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const rx  = new RegExp(`(${esc.join('|')})`, 'gi');
  const parts = text.split(rx);
  return (
    <>
      {parts.map((p, i) =>
        words.some((w) => w.toLowerCase() === p.toLowerCase())
          ? <span key={i} style={{ color: 'var(--text)', fontWeight: 600, fontStyle: 'normal' }}>{p}</span>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

export default function DonPage() {
  const t = useT();
  const td = t.don;
  return (
    <>
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem)' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>{td.label}</p>
          <h1 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(2.5rem,7vw,5.5rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 0.95, color: 'var(--text)' }}>
            {td.title}
          </h1>
        </ScrollReveal>
      </section>

      <section style={{ padding: '0 clamp(1.5rem,5vw,5rem) clamp(4rem,6vw,7rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(3rem,6vw,7rem)', alignItems: 'start' }}>

        {/* Left – message */}
        <ScrollReveal direction="left">
          <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', marginBottom: '1.5rem', lineHeight: 1.2 }}>
            {td.subTitle.split('\n').map((l, i) => (<span key={i}>{l}{i === 0 && <br />}</span>))}
          </h2>

          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.9, marginBottom: '1.2rem' }}>
            <Hilite text={td.p1} words={['\u00e9tudiant', 'passion']} />
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.9, marginBottom: '1.2rem' }}>
            <Hilite text={td.p2} words={['1\u00a0\u20ac', '2\u00a0\u20ac', '5\u00a0\u20ac', '\u00e0 la hauteur de vos moyens']} />
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.9, fontStyle: 'italic' }}>
            <Hilite text={td.p3} words={['Merci sinc\u00e8rement']} />
          </p>

          <p style={{ marginTop: '2rem', fontSize: '0.75rem', fontStyle: 'italic', fontFamily: 'var(--font-cormorant),serif', color: 'var(--text)', opacity: 0.6 }}>
            — Ghjulianu
          </p>
        </ScrollReveal>

        {/* Right – donate buttons */}
        <ScrollReveal direction="right" delay={120}>
          <div style={{ border: '1px solid var(--border)', padding: 'clamp(2rem,4vw,3.5rem)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Amounts hint */}
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--muted)' }}>
              {td.amountHint}
            </p>

            {/* PayPal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <p style={{ fontSize: '0.55rem', letterSpacing: '0.16em', color: 'rgba(122,122,116,0.55)' }}>{td.viaPaypal}</p>
              <a
                href="https://www.paypal.com/paypalme/ghjulianuc"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...btnBase, background: 'var(--accent)', color: '#080808' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.82'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
              >
                {/* PayPal icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.477z"/>
                </svg>
                {td.paypalBtn}
              </a>
            </div>

            <div style={{ height: '1px', background: 'var(--border)' }} />

            {/* Lydia */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <p style={{ fontSize: '0.55rem', letterSpacing: '0.16em', color: 'rgba(122,122,116,0.55)' }}>{td.viaLydia}</p>
              <a
                href="https://pay.lydia.me/l?t=ghjulianuc2ekd"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...btnBase, background: 'var(--accent)', color: '#080808' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.82'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
              >
                {/* Lydia icon */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M5 3h3v15h8v3H5z"/>
                </svg>
                {td.lydiaBtn}
              </a>
            </div>

            <div style={{ height: '1px', background: 'var(--border)' }} />

            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.7 }}>
              {td.contactHint}{' '}
              <Link href="/contact" style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}>
                {td.contactLink}
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
