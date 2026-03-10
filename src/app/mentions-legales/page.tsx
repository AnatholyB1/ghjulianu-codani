import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site ghjulianucodani.com — informations sur l\'éditeur, l\'hébergeur et les données personnelles.',
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
        fontFamily:  'var(--font-cormorant)',
        fontSize:    '1.05rem',
        lineHeight:  1.85,
        color:       'var(--text)',
        opacity:     0.8,
      }}
    >
      {children}
    </div>
  </section>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ marginBottom: '0.75rem' }}>{children}</p>
);

export default function MentionsLegalesPage() {
  return (
    <div
      style={{
        minHeight:  '100vh',
        background: 'var(--bg)',
        padding:    'clamp(3rem, 8vw, 6rem) clamp(1.5rem, 6vw, 8rem)',
        paddingTop: 'calc(var(--navbar-h) + clamp(3rem, 6vw, 5rem))',
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            fontFamily:    'var(--font-space)',
            fontSize:      '0.65rem',
            letterSpacing: '0.18em',
            color:         'var(--muted)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            display:       'inline-block',
            marginBottom:  '2.5rem',
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
            marginBottom:  '3.5rem',
            borderBottom:  '1px solid var(--border)',
            paddingBottom: '2rem',
          }}
        >
          Mentions légales
        </h1>

        {/* 1. Éditeur */}
        <Section title="1. Éditeur du site">
          <P><strong>Nom :</strong> Ghjulianu Codani</P>
          <P><strong>Qualité :</strong> Photographe indépendant — auto-entrepreneur</P>
          <P><strong>Siège :</strong> Paris &amp; Corse, France</P>
          <P>
            <strong>Contact :</strong>{' '}
            <a
              href="mailto:contact@ghjulianucodani.com"
              style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}
            >
              contact@ghjulianucodani.com
            </a>
          </P>
          <P>
            <strong>Instagram :</strong>{' '}
            <a
              href="https://instagram.com/ghjulianucodani"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}
            >
              @ghjulianucodani
            </a>
          </P>
          <P><strong>Directeur de la publication :</strong> Ghjulianu Codani</P>
        </Section>

        {/* 2. Hébergeur */}
        <Section title="2. Hébergeur">
          <P><strong>Raison sociale :</strong> Vercel Inc.</P>
          <P><strong>Adresse :</strong> 340 Pine Street, Suite 701 — San Francisco, CA 94104, États-Unis</P>
          <P>
            <strong>Site web :</strong>{' '}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}
            >
              vercel.com
            </a>
          </P>
        </Section>

        {/* 3. Conception */}
        <Section title="3. Conception &amp; développement">
          <P>
            Ce site a été conçu et développé par{' '}
            <a
              href="https://selenium-studio.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}
            >
              Selenium Studio
            </a>
            {' '}et{' '}
            <a
              href="https://anatholy-bricon.com/services"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}
            >
              Anatholy Bricon
            </a>.
          </P>
        </Section>

        {/* 4. Propriété intellectuelle */}
        <Section title="4. Propriété intellectuelle">
          <P>
            L'ensemble du contenu publié sur ce site — photographies, textes, visuels, logo, identité graphique — est la
            propriété exclusive de Ghjulianu Codani ou de ses partenaires et est protégé par les lois françaises et
            internationales relatives à la propriété intellectuelle, notamment le Code de la propriété intellectuelle
            (L.111-1 et suivants).
          </P>
          <P>
            Toute reproduction, représentation, modification, publication, transmission ou dénaturation, totale ou partielle,
            du contenu de ce site, par quelque procédé que ce soit, et sur quelque support que ce soit, est interdite sans
            autorisation écrite préalable de Ghjulianu Codani.
          </P>
          <P>
            Les photographies présentes sur ce site sont protégées au titre du droit d'auteur. Il est formellement interdit
            de les télécharger, reproduire, diffuser ou exploiter sans accord express de l'auteur.
          </P>
        </Section>

        {/* 5. Données personnelles */}
        <Section title="5. Données personnelles (RGPD)">
          <P>
            Conformément au Règlement général sur la protection des données (RGPD — UE 2016/679) et à la loi Informatique
            et Libertés (loi n° 78-17 du 6 janvier 1978 modifiée), vous disposez des droits suivants concernant vos données
            personnelles : droit d'accès, de rectification, d'effacement, de limitation du traitement, de portabilité et
            d'opposition.
          </P>
          <P>
            Les données transmises via le formulaire de contact (nom, adresse e-mail, message) sont uniquement utilisées
            pour répondre à votre demande et ne sont ni vendues, ni cédées à des tiers.
          </P>
          <P>
            Pour exercer vos droits ou pour toute question relative à vos données personnelles, vous pouvez contacter
            Ghjulianu Codani à l'adresse{' '}
            <a
              href="mailto:contact@ghjulianucodani.com"
              style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}
            >
              contact@ghjulianucodani.com
            </a>.
          </P>
          <P>
            En cas de réclamation non résolue, vous avez la possibilité de saisir la Commission Nationale de l'Informatique
            et des Libertés (CNIL) — <strong>www.cnil.fr</strong>.
          </P>
        </Section>

        {/* 6. Cookies */}
        <Section title="6. Cookies">
          <P>
            Ce site utilise des cookies techniques strictement nécessaires à son fonctionnement (authentification,
            gestion du panier de commandes). Aucun cookie publicitaire ou de traçage tiers n'est déposé sans votre
            consentement.
          </P>
          <P>
            Vous pouvez à tout moment désactiver les cookies via les paramètres de votre navigateur. La désactivation des
            cookies techniques peut toutefois altérer certaines fonctionnalités du site.
          </P>
        </Section>

        {/* 7. Responsabilité */}
        <Section title="7. Limitation de responsabilité">
          <P>
            Ghjulianu Codani s'efforce de maintenir les informations publiées sur ce site à jour et exactes. Cependant,
            il ne saurait être tenu responsable des erreurs, omissions ou des résultats qui pourraient être obtenus par
            un mauvais usage des informations publiées.
          </P>
          <P>
            Ce site peut contenir des liens hypertextes vers d'autres sites. Ghjulianu Codani n'exerce aucun contrôle sur
            ces sites tiers et décline toute responsabilité quant à leur contenu ou leurs pratiques.
          </P>
        </Section>

        {/* 8. Droit applicable */}
        <Section title="8. Droit applicable">
          <P>
            Le présent site et ses mentions légales sont soumis au droit français. En cas de litige, et après tentative
            de résolution amiable, les tribunaux français seront seuls compétents.
          </P>
          <P>
            Ces mentions légales ont été rédigées conformément à la Loi pour la Confiance dans l'Économie Numérique
            (LCEN — loi n° 2004-575 du 21 juin 2004).
          </P>
        </Section>

        {/* Footer date */}
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
          Dernière mise à jour : mars 2026
        </p>
      </div>
    </div>
  );
}
