'use client';
import ScrollReveal from '@/components/ScrollReveal';
import Link         from 'next/link';
import Image        from 'next/image';
import { useT }     from '@/hooks/useT';

export default function AboutPage() {
  const t = useT();
  return (
    <>
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem)' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>{t.about.label}</p>
          <h1 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(2.5rem,7vw,5.5rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 0.95, color: 'var(--text)' }}>
            {t.about.title}
          </h1>
        </ScrollReveal>
      </section>

      <section style={{ display: 'flex', gap: 'clamp(2rem,5vw,6rem)', alignItems: 'flex-start', padding: '0 clamp(1.5rem,5vw,5rem) clamp(4rem,6vw,7rem)', flexWrap: 'wrap' }}>
        {/* Portrait */}
        <ScrollReveal direction="left" style={{ flex: '0 0 clamp(200px,35%,400px)' }}>
          <div style={{ overflow: 'hidden', aspectRatio: '2/3' }}>
            <Image
              src="https://picsum.photos/seed/portrait1/600/900"
              alt="Ghjulianu Codani"
              width={600} height={900}
              unoptimized
              style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block', filter: 'brightness(0.85)' }}
            />
          </div>
        </ScrollReveal>

        {/* Bio */}
        <ScrollReveal direction="right" delay={120} style={{ flex: '1 1 300px', paddingTop: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', marginBottom: '2rem' }}>
            {t.about.name}
          </h2>

          <p style={{ fontSize: '0.9rem', lineHeight: 1.9, color: 'var(--muted)', marginBottom: '1.5rem' }}>
            {t.about.bio1}
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.9, color: 'var(--muted)', marginBottom: '1.5rem' }}>
            {t.about.bio2}
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.9, color: 'var(--muted)', marginBottom: '2.5rem' }}>
            {t.about.bio3}<strong style={{ color: 'var(--text)', fontWeight: 400 }}>ONESH, FURTIVE, FIGHTCLUB, UFO RECORDZ</strong>{t.about.bio3b}<strong style={{ color: 'var(--text)', fontWeight: 400 }}>ATRIA RECORDS, TECHNOSHOP</strong>{t.about.bio3c}
          </p>

          {/* Prestations tags */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {t.about.tags.map((tag) => (
              <span key={tag} style={{ fontSize: '0.6rem', letterSpacing: '0.12em', border: '1px solid var(--border)', padding: '0.35rem 0.9rem', color: 'var(--muted)' }}>
                {tag.toUpperCase()}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/portfolio" style={btnStyle('solid')}>{t.about.btnPortfolio}</Link>
            <Link href="/contact"   style={btnStyle('outline')}>{t.about.btnContact}</Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}

function btnStyle(v: 'solid' | 'outline') {
  return {
    display: 'inline-flex', alignItems: 'center',
    padding: '0.7rem 1.6rem', fontSize: '0.63rem', letterSpacing: '0.16em',
    textDecoration: 'none', cursor: 'pointer', transition: 'all 0.25s ease',
    ...(v === 'solid'
      ? { background: 'var(--text)', color: '#080808' }
      : { background: 'transparent', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.25)' }),
  } as const;
}
