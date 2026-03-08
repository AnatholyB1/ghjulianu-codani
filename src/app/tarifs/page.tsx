import ScrollReveal from '@/components/ScrollReveal';
import Link         from 'next/link';

export const metadata = {
  title: 'Tarifs — Ghjulianu Codani',
};

const TARIFS = [
  {
    title:    'SHOOTING PERSONNEL',
    price:    'Sur devis',
    duration: '2 – 4h',
    features: [
      'Préparation & brief créatif',
      'Shooting en studio ou en extérieur',
      'Sélection & retouche professionnelle',
      'Galerie privée en ligne',
      '20 photos finalisées minimum',
    ],
  },
  {
    title:    'POUR DES MARQUES',
    price:    'Sur devis',
    duration: 'Demi-journée ou journée',
    highlight: true,
    features: [
      'Consulting visuel & direction artistique',
      'Shooting produit ou lifestyle',
      'Retouche et calibration colorimétrique',
      'Livraison haute résolution',
      'Droits d\'utilisation commerciale inclus',
    ],
  },
  {
    title:    'ÉVÉNEMENTIEL NIGHTLIFE',
    price:    'Sur devis',
    duration: 'Durée de l\'event',
    features: [
      'Présence complète sur l\'événement',
      'Photographie en lumière artificielle',
      'Sélection & retouche express',
      'Galerie en ligne sous 48h',
      'Livraison adaptée aux réseaux sociaux',
    ],
  },
];

export default function TarifsPage() {
  return (
    <>
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem)' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>TARIFS</p>
          <h1 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(2.5rem,7vw,5.5rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 0.95, color: 'var(--text)' }}>
            Prestations
          </h1>
          <p style={{ marginTop: '1.2rem', fontSize: '0.8rem', color: 'var(--muted)', maxWidth: '500px', lineHeight: 1.8 }}>
            Chaque projet est unique. Les tarifs ci-dessous sont indicatifs — contactez-moi pour un devis personnalisé.
          </p>
        </ScrollReveal>
      </section>

      <section style={{ padding: '0 clamp(1.5rem,5vw,5rem) clamp(4rem,6vw,7rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1px', border: '1px solid var(--border)', maxWidth: '1200px' }}>
        {TARIFS.map((t, i) => (
          <ScrollReveal key={t.title} direction="up" delay={i * 100}>
            <div
              style={{
                padding:    'clamp(2rem,4vw,3rem)',
                background:  t.highlight ? 'rgba(200,169,126,0.05)' : 'transparent',
                borderLeft:  t.highlight ? '1px solid var(--accent)' : undefined,
                height:      '100%',
                display:     'flex',
                flexDirection: 'column',
              }}
            >
              {t.highlight && (
                <span style={{ fontSize: '0.55rem', letterSpacing: '0.18em', color: 'var(--accent)', marginBottom: '1rem', display: 'block' }}>
                  RECOMMANDÉ
                </span>
              )}
              <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.2rem,2.5vw,1.6rem)', fontStyle: 'italic', fontWeight: 400, color: 'var(--text)', marginBottom: '0.5rem' }}>
                {t.title}
              </h2>
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.4rem' }}>{t.duration}</p>
              <p style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.4rem,3vw,2rem)', fontStyle: 'italic', color: t.highlight ? 'var(--accent)' : 'var(--text)', marginBottom: '2rem', marginTop: '0.5rem' }}>
                {t.price}
              </p>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem', flex: 1 }}>
                {t.features.map((f) => (
                  <li key={f} style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.6, display: 'flex', gap: '0.6rem' }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>—</span> {f}
                  </li>
                ))}
              </ul>

              <Link href="/contact" style={{ display: 'inline-flex', marginTop: '2.5rem', fontSize: '0.63rem', letterSpacing: '0.16em', color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)', padding: '0.65rem 1.4rem', transition: 'border-color 0.25s, color 0.25s', width: 'fit-content' }}>
                DEMANDER UN DEVIS
              </Link>
            </div>
          </ScrollReveal>
        ))}
      </section>
    </>
  );
}
