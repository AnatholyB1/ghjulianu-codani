'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { useLang, type Lang } from '@/contexts/LanguageContext';

const EMAIL = 'ghjulianu.codani2@gmail.com';
const CONSENT_VERSION = 'v1';

type Block = string; // paragraph; **bold** supported; {email} replaced by a mailto link
interface Sec { title: string; body: Block[] }

interface Doc {
  back: string;
  h1: string;
  updated: string;
  sections: Sec[];
  footer: string;
}

const FR: Doc = {
  back: '← Retour',
  h1: 'Politique de confidentialité',
  updated: 'Dernière mise à jour : novembre 2026 — Conforme au RGPD (UE 2016/679) — Version du texte de consentement newsletter : ' + CONSENT_VERSION,
  footer: 'Politique de confidentialité — Ghjulianu Codani ©',
  sections: [
    {
      title: '1. Responsable du traitement',
      body: [
        '**Identité :** Ghjulianu Codani — Photographe indépendant, auto-entrepreneur',
        '**Adresse :** Paris & Corse, France',
        '**Contact :** {email}',
      ],
    },
    {
      title: '2. Données collectées',
      body: [
        'Ce site ne collecte que les données strictement utiles à chacune de ses fonctions :',
        '— **Formulaire de contact :** nom, adresse e-mail, message et type de projet.',
        '— **Téléchargement de photos :** votre adresse e-mail, la liste des photos demandées, la date de la demande et une empreinte (hash) irréversible de votre adresse IP, utilisée uniquement pour limiter les abus.',
        '— **Newsletter (facultative) :** votre adresse e-mail, la date et la version du texte de consentement que vous avez accepté, ainsi qu’une empreinte de votre adresse IP comme preuve.',
        '— **Mesure d’audience anonyme :** pages et photos consultées, type d’appareil (mobile, tablette, ordinateur) et pays, sans cookie. Voir la section 7.',
      ],
    },
    {
      title: '3. Finalités et bases légales',
      body: [
        '— **Vous envoyer le lien de téléchargement de vos photos** que vous avez demandé : exécution de votre demande (article 6.1.b du RGPD). Ce lien est valable 48 heures et permet 3 sessions de téléchargement de 15 minutes.',
        '— **Vous envoyer la newsletter, si vous cochez la case dédiée :** votre **consentement** (article 6.1.a). Cette case est facultative et décochée par défaut ; le téléchargement ne dépend jamais d’elle. Vous confirmez ensuite votre inscription en cliquant sur un lien reçu par e-mail (double confirmation). Vous pouvez retirer votre consentement à tout moment via le lien de désinscription présent dans chaque e-mail.',
        '— **Répondre à vos demandes de contact ou de devis :** intérêt légitime (article 6.1.f) et mesures précontractuelles (article 6.1.b).',
        '— **Mesurer l’audience de manière anonyme** (photos les plus vues, appareils, pays) afin d’améliorer le site : intérêt légitime (article 6.1.f). Aucune donnée n’est recoupée avec d’autres traitements.',
        '— **Sécurité et prévention des abus** (limitation du nombre de demandes) : intérêt légitime (article 6.1.f).',
        'Votre adresse e-mail de téléchargement n’est **jamais** ajoutée à la newsletter sans votre consentement explicite.',
      ],
    },
    {
      title: '4. Durées de conservation',
      body: [
        '— **Abonnés à la newsletter :** jusqu’à votre désinscription, et au maximum **3 ans** après votre dernier contact avec nous. Après désinscription, une trace minimale est conservée pour respecter votre choix.',
        '— **Demandes de téléchargement (e-mail, liste de photos) :** **90 jours** après l’expiration du lien.',
        '— **Données de mesure d’audience (événements bruts) :** **13 mois** maximum, puis suppression ; seules des statistiques agrégées non personnelles peuvent être conservées.',
        '— **Compteurs de limitation d’abus :** quelques jours au plus.',
        '— **Formulaire de contact :** durée nécessaire au traitement de votre demande, et au maximum **3 ans** après le dernier contact.',
      ],
    },
    {
      title: '5. Sous-traitants et destinataires',
      body: [
        'Vos données sont destinées uniquement à Ghjulianu Codani. Elles ne sont ni vendues, ni louées, ni cédées à des fins commerciales. Nous faisons appel aux sous-traitants suivants, qui n’agissent que sur nos instructions :',
        '— **Resend** (États-Unis) : envoi des e-mails (liens de téléchargement, confirmation et newsletter).',
        '— **Supabase** : base de données et stockage des fichiers.',
        '— **Vercel Inc.** (États-Unis) : hébergement du site.',
        '— **Railway** : traitement du formulaire de contact.',
        'Les transferts hors Union européenne sont encadrés par les clauses contractuelles types de la Commission européenne et/ou le cadre de protection des données UE–États-Unis (article 46 du RGPD).',
      ],
    },
    {
      title: '6. Vos droits',
      body: [
        'Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants : **accès**, **rectification**, **effacement**, **limitation**, **opposition**, **portabilité**, ainsi que le droit de retirer votre consentement à tout moment et de définir des directives sur le sort de vos données après votre décès.',
        'Pour exercer ces droits, ou pour demander la suppression de votre adresse e-mail de nos fichiers, écrivez à : {email}. Une réponse vous est apportée dans un délai d’un mois.',
        'En l’absence de réponse satisfaisante, vous pouvez introduire une réclamation auprès de la **CNIL** — www.cnil.fr.',
      ],
    },
    {
      title: '7. Cookies, mesure d’audience et adresses IP',
      body: [
        'Le site n’utilise que des cookies **strictement nécessaires** à son fonctionnement (authentification administrateur, accès à un album privé). Aucun cookie publicitaire, de profilage ou de suivi n’est déposé.',
        'La mesure d’audience est réalisée **sans cookie et sans conserver votre adresse IP**. Un identifiant anonyme est calculé à partir d’un hachage irréversible de votre adresse IP et de votre navigateur combiné à un secret qui change chaque jour ; il ne permet donc pas de vous suivre d’un jour à l’autre ni de remonter jusqu’à vous. Les adresses IP ne sont jamais enregistrées en clair.',
      ],
    },
    {
      title: '8. Sécurité',
      body: [
        'Connexions chiffrées (HTTPS/TLS), accès administrateur protégé par authentification, jetons de téléchargement aléatoires stockés uniquement sous forme d’empreinte, tables de données personnelles inaccessibles depuis le navigateur (accès réservé au serveur), hébergement sur infrastructure Supabase (SOC 2 Type II).',
      ],
    },
    {
      title: '9. Modifications',
      body: [
        'Cette politique peut être mise à jour pour refléter des évolutions légales ou techniques. La date de dernière mise à jour figure en haut de la page. Si le texte de consentement à la newsletter change, sa version change également et un nouveau consentement vous est demandé si nécessaire.',
      ],
    },
  ],
};

const EN: Doc = {
  back: '← Back',
  h1: 'Privacy policy',
  updated: 'Last updated: November 2026 — GDPR compliant (EU 2016/679) — Newsletter consent text version: ' + CONSENT_VERSION,
  footer: 'Privacy policy — Ghjulianu Codani ©',
  sections: [
    {
      title: '1. Data controller',
      body: [
        '**Identity:** Ghjulianu Codani — independent photographer, sole proprietor',
        '**Address:** Paris & Corsica, France',
        '**Contact:** {email}',
      ],
    },
    {
      title: '2. Data we collect',
      body: [
        'This site only collects the data strictly needed for each of its features:',
        '— **Contact form:** name, email address, message and project type.',
        '— **Photo downloads:** your email address, the list of requested photos, the request date and an irreversible hash of your IP address, used only to limit abuse.',
        '— **Newsletter (optional):** your email address, the date and version of the consent text you accepted, and a hash of your IP address as proof.',
        '— **Anonymous audience measurement:** pages and photos viewed, device type (mobile, tablet, desktop) and country, without any cookie. See section 7.',
      ],
    },
    {
      title: '3. Purposes and legal bases',
      body: [
        '— **Sending you the download link for the photos you requested:** performance of your request (GDPR article 6.1.b). The link is valid for 48 hours and allows 3 download sessions of 15 minutes.',
        '— **Sending you the newsletter, if you tick the dedicated box:** your **consent** (article 6.1.a). The box is optional and unticked by default; your download never depends on it. You then confirm your subscription by clicking a link sent by email (double opt-in). You can withdraw your consent at any time using the unsubscribe link included in every email.',
        '— **Answering your contact or quote requests:** legitimate interest (article 6.1.f) and pre-contractual measures (article 6.1.b).',
        '— **Measuring audience anonymously** (most viewed photos, devices, countries) to improve the site: legitimate interest (article 6.1.f). No data is cross-referenced with other processing.',
        '— **Security and abuse prevention** (limiting the number of requests): legitimate interest (article 6.1.f).',
        'The email address you use to download photos is **never** added to the newsletter without your explicit consent.',
      ],
    },
    {
      title: '4. Retention periods',
      body: [
        '— **Newsletter subscribers:** until you unsubscribe, and at most **3 years** after your last contact with us. After unsubscribing, a minimal record is kept to honour your choice.',
        '— **Download requests (email, photo list):** **90 days** after the link expires.',
        '— **Audience measurement data (raw events):** at most **13 months**, then deleted; only non-personal aggregated statistics may be kept.',
        '— **Abuse-limiting counters:** a few days at most.',
        '— **Contact form:** as long as needed to handle your request, and at most **3 years** after the last contact.',
      ],
    },
    {
      title: '5. Processors and recipients',
      body: [
        'Your data is intended only for Ghjulianu Codani. It is never sold, rented or transferred for commercial purposes. We use the following processors, which act only on our instructions:',
        '— **Resend** (United States): sending emails (download links, confirmation and newsletter).',
        '— **Supabase**: database and file storage.',
        '— **Vercel Inc.** (United States): website hosting.',
        '— **Railway**: contact form processing.',
        'Transfers outside the European Union are covered by the European Commission’s standard contractual clauses and/or the EU–US Data Privacy Framework (GDPR article 46).',
      ],
    },
    {
      title: '6. Your rights',
      body: [
        'Under the GDPR and the French Data Protection Act you have the rights of **access**, **rectification**, **erasure**, **restriction**, **objection** and **portability**, the right to withdraw your consent at any time, and the right to set directives on what happens to your data after your death.',
        'To exercise these rights, or to ask for your email address to be removed from our records, write to: {email}. We reply within one month.',
        'If you are not satisfied with our answer, you may lodge a complaint with the **CNIL** — www.cnil.fr.',
      ],
    },
    {
      title: '7. Cookies, audience measurement and IP addresses',
      body: [
        'The site only uses cookies that are **strictly necessary** for it to work (administrator login, private album access). No advertising, profiling or tracking cookie is set.',
        'Audience measurement is done **without cookies and without storing your IP address**. An anonymous identifier is computed from an irreversible hash of your IP address and browser combined with a secret that changes every day; it therefore cannot be used to follow you from one day to the next or to identify you. IP addresses are never stored in clear.',
      ],
    },
    {
      title: '8. Security',
      body: [
        'Encrypted connections (HTTPS/TLS), authenticated administrator access, random download tokens stored only as a hash, personal-data tables not reachable from the browser (server-only access), hosting on Supabase infrastructure (SOC 2 Type II).',
      ],
    },
    {
      title: '9. Changes',
      body: [
        'This policy may be updated to reflect legal or technical changes. The last-updated date is shown at the top of the page. If the newsletter consent text changes, its version changes too and your consent is requested again where necessary.',
      ],
    },
  ],
};

const DOCS: Record<Lang, Doc> = { fr: FR, en: EN };

const mailLink = (
  <a
    href={`mailto:${EMAIL}`}
    style={{ color: 'var(--accent-text)', textDecoration: 'none', borderBottom: '1px solid var(--accent-text)', paddingBottom: '1px' }}
  >
    {EMAIL}
  </a>
);

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\{email\})/g);
  return parts.map((part, i) => {
    if (part === '{email}') return <Fragment key={i}>{mailLink}</Fragment>;
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function PrivacyContent() {
  const { lang } = useLang();
  const doc = DOCS[lang];

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
          {doc.back}
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
          {doc.h1}
        </h1>

        <p
          style={{
            fontFamily:    'var(--font-space)',
            fontSize:      '0.6rem',
            letterSpacing: '0.1em',
            color:         'var(--muted)',
            marginBottom:  '3.5rem',
            lineHeight:    1.7,
          }}
        >
          {doc.updated}
        </p>

        {doc.sections.map((s) => (
          <section key={s.title} style={{ marginBottom: '3rem' }}>
            <h2
              style={{
                fontFamily:    'var(--font-space)',
                fontSize:      '0.65rem',
                letterSpacing: '0.18em',
                color:         'var(--accent-text)',
                textTransform: 'uppercase',
                marginBottom:  '1.2rem',
              }}
            >
              {s.title}
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
              {s.body.map((p, i) => (
                <p key={i} style={{ marginBottom: '0.75rem' }}>{renderInline(p)}</p>
              ))}
            </div>
          </section>
        ))}

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
          {doc.footer} {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
