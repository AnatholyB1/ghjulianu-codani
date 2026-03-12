import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et protection des données personnelles du site ghjulianucodani.com — conformité RGPD.',
  robots: { index: false },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: '3rem' }}>
    <h2
      style={{
        fontFamily:    'var(--font-space)',
        fontSize:      '0.65rem',
        letterSpacing: '0.18em',
        color:         'var(--accent)',
        textTransform: 'uppercase',
        marginBottom:  '1.2rem',
      }}
    >
      {title}
    </h2>
    <div
      style={{
        fontFamily: 'var(--font-cormorant)',
        fontSize:   '1.05rem',
        lineHeight: 1.85,
        color:      'var(--text)',
        opacity:    0.8,
      }}
    >
      {children}
    </div>
  </section>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ marginBottom: '0.75rem' }}>{children}</p>
);

export default function PolitiqueConfidentialitePage() {
  return (
    <div
      style={{
        minHeight:  '100vh',
        background: 'var(--bg)',
        padding:    'clamp(3rem, 8vw, 6rem) clamp(1.5rem, 6vw, 8rem)',
        paddingTop: 'calc(var(--navbar-h) + clamp(3rem, 6vw, 5rem))',
      }}
    >
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            fontFamily:     'var(--font-space)',
            fontSize:       '0.65rem',
            letterSpacing:  '0.18em',
            color:          'var(--muted)',
            textDecoration: 'none',
            textTransform:  'uppercase',
            display:        'inline-block',
            marginBottom:   '2.5rem',
          }}
        >
          ← Retour
        </Link>

        <h1
          style={{
            fontFamily:    'var(--font-cormorant)',
            fontSize:      'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight:    300,
            letterSpacing: '0.04em',
            color:         'var(--text)',
            lineHeight:    1.1,
            marginBottom:  '1rem',
            borderBottom:  '1px solid var(--border)',
            paddingBottom: '2rem',
          }}
        >
          Politique de confidentialité
        </h1>

        <p
          style={{
            fontFamily:    'var(--font-space)',
            fontSize:      '0.6rem',
            letterSpacing: '0.1em',
            color:         'var(--muted)',
            marginBottom:  '3.5rem',
          }}
        >
          Dernière mise à jour : mars 2026 — Conforme au RGPD (UE 2016/679)
        </p>

        {/* 1. Responsable du traitement */}
        <Section title="1. Responsable du traitement">
          <P><strong>Identité :</strong> Ghjulianu Codani — Photographe indépendant, auto-entrepreneur</P>
          <P><strong>Adresse :</strong> Paris &amp; Corse, France</P>
          <P>
            <strong>Contact :</strong>{' '}
            <a
              href="mailto:ghjulianu.codani2@gmail.com"
              style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}
            >
              ghjulianu.codani2@gmail.com
            </a>
          </P>
        </Section>

        {/* 2. Données collectées */}
        <Section title="2. Données collectées">
          <P>Ce site collecte uniquement les données que vous transmettez volontairement via le <strong>formulaire de contact</strong> :</P>
          <P>— <strong>Nom</strong> (prénom et/ou nom)</P>
          <P>— <strong>Adresse e-mail</strong></P>
          <P>— <strong>Message</strong> et <strong>type de projet</strong></P>
          <P>
            Aucune autre donnée personnelle n'est collectée. Le site ne recourt à aucun cookie de traçage, aucun pixel
            publicitaire, et aucun outil d'analyse comportementale tiers (Google Analytics, Hotjar, etc.).
          </P>
        </Section>

        {/* 3. Finalités et base légale */}
        <Section title="3. Finalités et base légale du traitement">
          <P>Les données collectées sont utilisées <strong>exclusivement</strong> pour :</P>
          <P>— Répondre à votre demande de contact ou de devis</P>
          <P>— Assurer le suivi de la relation commerciale</P>
          <P>
            La base légale du traitement est l&apos;<strong>intérêt légitime</strong> (article 6.1.f du RGPD) — répondre
            aux sollicitations entrantes — et l&apos;<strong>exécution de mesures précontractuelles</strong> à votre
            demande (article 6.1.b).
          </P>
        </Section>

        {/* 4. Durée de conservation */}
        <Section title="4. Durée de conservation">
          <P>
            Les données transmises via le formulaire de contact sont conservées pour la durée nécessaire au traitement
            de votre demande, et au maximum <strong>3 ans</strong> à compter du dernier contact, conformément aux
            recommandations de la CNIL.
          </P>
          <P>
            À l'issue de cette période, vos données sont supprimées ou anonymisées.
          </P>
        </Section>

        {/* 5. Destinataires */}
        <Section title="5. Destinataires des données">
          <P>
            Vos données personnelles sont destinées <strong>uniquement à Ghjulianu Codani</strong> et ne sont ni
            vendues, ni louées, ni cédées à des tiers à des fins commerciales.
          </P>
          <P>
            Les données transitent via le service d'automatisation <strong>Railway</strong> (webhook de traitement du
            formulaire) et sont soumises à leur propre politique de confidentialité. Ce prestataire agit en qualité de
            sous-traitant et ne traite vos données qu'aux fins décrites ci-dessus.
          </P>
        </Section>

        {/* 6. Transferts hors UE */}
        <Section title="6. Transferts hors Union Européenne">
          <P>
            L'hébergement du site est assuré par <strong>Vercel Inc.</strong> (États-Unis). Les transferts de données
            vers ce prestataire sont encadrés par les clauses contractuelles types de la Commission européenne,
            conformément à l'article 46 du RGPD.
          </P>
        </Section>

        {/* 7. Vos droits */}
        <Section title="7. Vos droits">
          <P>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :</P>
          <P>— <strong>Droit d'accès</strong> : obtenir une copie de vos données</P>
          <P>— <strong>Droit de rectification</strong> : corriger des données inexactes</P>
          <P>— <strong>Droit à l'effacement</strong> (« droit à l'oubli »)</P>
          <P>— <strong>Droit à la limitation</strong> du traitement</P>
          <P>— <strong>Droit d'opposition</strong> au traitement</P>
          <P>— <strong>Droit à la portabilité</strong> de vos données</P>
          <P>
            Pour exercer l'un de ces droits, contactez :{' '}
            <a
              href="mailto:ghjulianu.codani2@gmail.com"
              style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}
            >
              ghjulianu.codani2@gmail.com
            </a>
            . Une réponse vous sera apportée dans un délai d'un mois.
          </P>
          <P>
            En l'absence de réponse satisfaisante, vous pouvez introduire une réclamation auprès de la{' '}
            <strong>CNIL</strong> — Commission Nationale de l'Informatique et des Libertés —{' '}
            <strong>www.cnil.fr</strong>.
          </P>
        </Section>

        {/* 8. Cookies */}
        <Section title="8. Cookies et traceurs">
          <P>
            Ce site utilise des cookies <strong>strictement nécessaires</strong> à son fonctionnement
            (authentification administrateur, gestion de l'album privé). Ces cookies ne nécessitent pas de
            consentement préalable au titre de l'article 82 de la loi Informatique et Libertés.
          </P>
          <P>
            Aucun cookie publicitaire, de profilage ou d'analyse comportementale tiers n'est déposé sur votre
            navigateur.
          </P>
        </Section>

        {/* 9. Sécurité */}
        <Section title="9. Sécurité des données">
          <P>
            Des mesures techniques et organisationnelles appropriées sont mises en œuvre pour protéger vos données
            contre tout accès non autorisé, perte, altération ou divulgation : connexions chiffrées (HTTPS/TLS),
            accès administrateur protégé par authentification sécurisée, stockage des fichiers sur infrastructure
            Supabase (SOC 2 Type II certifié).
          </P>
        </Section>

        {/* 10. Modifications */}
        <Section title="10. Modifications de la présente politique">
          <P>
            Cette politique de confidentialité peut être mise à jour à tout moment pour refléter des évolutions
            légales, réglementaires ou techniques. La date de dernière mise à jour est indiquée en haut de cette page.
            La version en vigueur est toujours consultable à l'adresse{' '}
            <strong>/politique-de-confidentialite</strong>.
          </P>
        </Section>

        <p
          style={{
            fontFamily:    'var(--font-space)',
            fontSize:      '0.6rem',
            letterSpacing: '0.1em',
            color:         'var(--muted)',
            marginTop:     '4rem',
            borderTop:     '1px solid var(--border)',
            paddingTop:    '1.5rem',
          }}
        >
          Politique de confidentialité — Ghjulianu Codani © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
