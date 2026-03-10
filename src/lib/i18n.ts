import type { Lang } from '@/contexts/LanguageContext';

const translations = {
  fr: {
    // ── Navbar ──────────────────────────────────────────────
    nav: {
      portfolio: 'PORTFOLIO',
      albums:    'ALBUMS',
      about:     'À PROPOS',
      tarifs:    'TARIFS',
      contact:   'CONTACT',
      don:       'FAIRE UN DON',
    },

    // ── Home ────────────────────────────────────────────────
    home: {
      heroSubtitle:   'PHOTOGRAPHE — PARIS || CORSE',
      ctaPortfolio:   'VOIR LE PORTFOLIO',
      ctaContact:     'ME CONTACTER',
      scroll:         'SCROLL',
      prestationsLabel: 'PRESTATIONS',
      prestationsDesc1: "Photographe spécialisé dans l'univers nightlife et musique électronique, je travaille au cœur des clubs, des événements et des scènes artistiques afin de capturer l'atmosphère unique de chaque moment.",
      prestationsDesc2: "Mon approche se concentre sur l'énergie des lieux, la présence des artistes et les interactions qui donnent vie à la nuit. Chaque projet est pour moi l'occasion de créer des images à la fois immersives, sensibles et visuellement fortes.",
      availableFor:   'DISPONIBLE POUR',
      availableItems: [
        "Couverture d'événements : clubs, soirées, festivals et événements culturels",
        'DJ et artistes : coverage de set, portraits, visuels promotionnels',
        'Labels et marques : création de contenu visuel et image de marque',
        'Shootings portrait : solo ou groupe, dans un univers artistique ou éditorial',
      ],
      seeRates:       'VOIR LES TARIFS →',
      latestEvents:   'DERNIERS ÉVÉNEMENTS',
      seeAllAlbums:   'VOIR TOUS LES ALBUMS →',
      noEvents:       "Aucun événement pour l'instant.",
      dateLocale:     'fr-FR',
    },

    // ── About ───────────────────────────────────────────────
    about: {
      label:       'À PROPOS',
      title:       'Fiche de présentation',
      name:        'Ghjulianu Codani',
      bio1:        "Photographe spécialisé dans l'événementiel nightlife, le shooting personnel et la communication de marque. Basé à Paris, j'interviens lors des soirées, festivals et événements pour capturer des instants vrais dans des environnements souvent imprévisibles.",
      bio2:        "Mon approche se définit par une photographie atmosphérique, brute et contrastée — proche du sujet, dans l'instant. Je travaille principalement en lumière ambiante, stroboscopique ou artificielle, cherchant systématiquement la composition dans le chaos.",
      bio3:        "Parmi mes collaborations : ",
      bio3b:       " (événements) et ",
      bio3c:       " (marques / labels).",
      tags:        ['Shooting Personnel', 'Marques & Labels', 'Événementiel Nightlife'],
      btnPortfolio: 'PORTFOLIO',
      btnContact:   'ME CONTACTER',
    },

    // ── Tarifs ──────────────────────────────────────────────
    tarifs: {
      label:          'TARIFS',
      title:          'Prestations',
      desc:           'Chaque projet est unique. Tous les tarifs sont sur devis —',
      descLink:       'contactez-moi',
      descEnd:        'pour en discuter.',
      quote:          'Sur devis',
      cta:            'DEMANDER UN DEVIS',
      badgeShooting:  'RECOMMANDÉ — SHOOTING',
      badgeEvent:     'RECOMMANDÉ — ÉVÉNEMENT',
      formulaLabel:   'FORMULE',
      customTitle:    'Sur-mesure',
      customPhotos:   'Nombre de photos personnalisable',
      customDuration: '~Variable',
      customTagline:  'Chaque projet est différent. Parlons-en.',
      prestations: [
        {
          id: 'SPARK', badge: 'badgeShooting',
          photos: '10 – 20 photos finalisées', duration: '~1 – 2h',
          features: [
            'Préparation & brief créatif',
            'Shooting en club, studio ou en extérieur',
            'Sélection & retouche professionnelle',
            'Galerie privée en ligne',
          ],
        },
        {
          id: 'GROOVE', badge: null,
          photos: '30 – 50 photos finalisées', duration: 'Événement ~3h · Shooting ~2h',
          features: [
            'Préparation & brief créatif',
            "Shooting lors d'un set complet, DJ ou portraits de groupe",
            'Sélection & retouche professionnelle',
            'Révision retouche incluse : 1 ajustement par photo',
            'Galerie privée en ligne',
          ],
        },
        {
          id: 'NIGHTLIFE', badge: null,
          photos: '60 – 100 photos finalisées', duration: 'Événement ~durée event · Shooting ~3h',
          features: [
            'Préparation & brief créatif',
            "Couverture complète d'un événement ou shooting artistique",
            'Sélection & retouche professionnelle',
            'Révisions retouche incluses : 2 ajustements par photo',
            'Galerie privée en ligne',
          ],
        },
        {
          id: 'IMMERSION', badge: 'badgeEvent',
          photos: '100 – 160 photos finalisées', duration: 'Événement totalité · Shooting ~5h',
          features: [
            'Préparation & brief créatif',
            "Shooting détaillé lors d'une soirée, d'un set DJ ou projet artistique",
            'Sélection & retouche professionnelle',
            'Révisions retouche incluses : 2 ajustements par photo',
            'Galerie privée en ligne',
          ],
        },
      ],
      customFeatures: [
        'Préparation & brief créatif personnalisé',
        'Événements sur plusieurs jours, festivals, longs déplacements ou projets ambitieux',
        'Sélection & retouche professionnelle',
        'Révisions retouche incluses : 2 ajustements par photo',
        'Galerie privée en ligne',
      ],
    },

    // ── Contact ─────────────────────────────────────────────
    contact: {
      label:        'CONTACT',
      title:        'Travaillons ensemble',
      subtitle:     "Un projet, une envie, une question ? Décrivez-moi ce que vous avez en tête et je reviendrai vers vous rapidement.",
      availableFor: 'Disponible pour',
      availableItems: [
        'Shootings artistiques & portraits',
        'Événements nightlife & soirées',
        'Communication de marque',
        'Collaborations créatives',
        'Projets sur-mesure & festivals',
      ],
      location:    "Basé à Paris & Corse —\ndisponible pour des déplacements en France et à l'international.",
      seeTarifs:   'VOIR LES PRESTATIONS →',
      formTitle:   'Votre message',
      nameLabel:   'NOM',
      namePlaceholder: 'Votre nom',
      emailLabel:  'EMAIL',
      projectLabel: 'TYPE DE PROJET',
      projectPlaceholder: '— Choisissez une formule',
      messageLabel: 'MESSAGE',
      messagePlaceholder: 'Décrivez votre projet — lieu, date, ambiance souhaitée…',
      sendBtn:     'ENVOYER MA DEMANDE',
      mailHint:    'En cliquant sur envoyer, votre client mail s\'ouvrira avec le message pré-rempli.',
      sentTitle:   'Merci !',
      sentBody:    'Je reviens vers vous très vite.',
      mailSubject: 'Demande de devis',
      projets: [
        'Shooting SPARK (1–2h, 10–20 photos)',
        'Shooting GROOVE (2–3h, 30–50 photos)',
        'Événement NIGHTLIFE (60–100 photos)',
        'Événement IMMERSION (100–160 photos)',
        'Formule sur-mesure',
        'Autre',
      ],
    },

    // ── Don ─────────────────────────────────────────────────
    don: {
      label:        'SOUTENIR',
      title:        'Faire un don',
      subTitle:     "Vous appréciez\nmon travail ?",
      p1:           "Je suis étudiant et je fais de la photographie par passion, pour raconter des histoires d'émotion à travers les nuits, les artistes, les lumières et les instants partagés. Chaque photo est une tentative de capturer l'énergie d'un lieu, la sensibilité d'un moment et la magie qui naît de la beauté de l'ombre éclairée.",
      p2:           "Si mon travail vous touche et que vous souhaitez soutenir ce que je fais, vous pouvez laisser un petit don. Même 1\u00a0€, 2\u00a0€, 5\u00a0€ ou plus, à la hauteur de vos moyens, représente déjà un soutien énorme et m'aide à continuer à créer et à photographier ces instants précieux.",
      p3:           "Merci sincèrement\u00a0:')",
      amountHint:   "CHOISISSEZ LE MONTANT QUI VOUS CONVIENT — 1 €, 2 €, 5 € ou plus",
      viaPaypal:    'VIA PAYPAL',
      paypalBtn:    'FAIRE UN DON VIA PAYPAL',
      viaLydia:     'VIA LYDIA / SUMERIA',
      lydiaBtn:     'FAIRE UN DON VIA LYDIA',
      contactHint:  "Besoin de photos ou d'un projet commun ?",
      contactLink:  'Contactez-moi',
    },

    // ── Albums ──────────────────────────────────────────────
    albums: {
      all:    'TOUT',
      drag:   '← GLISSER →',
      dateLocale: 'fr-FR',
    },

    // ── Footer ──────────────────────────────────────────────
    footer: {
      mentions: 'Mentions légales',
      madeBy:   'Site créé par',
      and:      '&',
    },

    // ── BottomBar ────────────────────────────────────────────
    bottomBar: {
      enjoy:   'Vous appréciez mon travail ?',
      donate:  'Faire un don',
      contact: 'CONTACT',
    },
  },

  // ─────────────────────────────────────────────────────────
  // ENGLISH
  // ─────────────────────────────────────────────────────────
  en: {
    nav: {
      portfolio: 'PORTFOLIO',
      albums:    'ALBUMS',
      about:     'ABOUT',
      tarifs:    'PRICING',
      contact:   'CONTACT',
      don:       'SUPPORT ME',
    },

    home: {
      heroSubtitle:   'PHOTOGRAPHER — PARIS || CORSICA',
      ctaPortfolio:   'VIEW PORTFOLIO',
      ctaContact:     'CONTACT ME',
      scroll:         'SCROLL',
      prestationsLabel: 'SERVICES',
      prestationsDesc1: 'Photographer specializing in nightlife and electronic music, I work at the heart of clubs, events and artistic scenes to capture the unique atmosphere of each moment.',
      prestationsDesc2: 'My approach focuses on the energy of spaces, the presence of artists, and the interactions that bring the night to life. Every project is an opportunity to create images that are immersive, sensitive and visually compelling.',
      availableFor:   'AVAILABLE FOR',
      availableItems: [
        'Event coverage: clubs, parties, festivals and cultural events',
        'DJs and artists: set coverage, portraits, promotional visuals',
        'Labels and brands: visual content creation and brand identity',
        'Portrait sessions: solo or group, artistic or editorial style',
      ],
      seeRates:       'SEE PRICING →',
      latestEvents:   'LATEST EVENTS',
      seeAllAlbums:   'VIEW ALL ALBUMS →',
      noEvents:       'No events yet.',
      dateLocale:     'en-GB',
    },

    about: {
      label:       'ABOUT',
      title:       'About me',
      name:        'Ghjulianu Codani',
      bio1:        'Photographer specialized in nightlife events, personal shootings and brand communication. Based in Paris, I work at parties, festivals and events to capture real moments in often unpredictable environments.',
      bio2:        'My approach is defined by atmospheric, raw and contrasted photography — close to the subject, in the moment. I work mainly in ambient, strobe or artificial light, always searching for composition within the chaos.',
      bio3:        'Among my collaborations: ',
      bio3b:       ' (events) and ',
      bio3c:       ' (brands / labels).',
      tags:        ['Personal Shooting', 'Brands & Labels', 'Nightlife Events'],
      btnPortfolio: 'PORTFOLIO',
      btnContact:   'CONTACT ME',
    },

    tarifs: {
      label:          'PRICING',
      title:          'Services',
      desc:           'Every project is unique. All rates are on estimate —',
      descLink:       'contact me',
      descEnd:        'to discuss.',
      quote:          'On estimate',
      cta:            'REQUEST A QUOTE',
      badgeShooting:  'RECOMMENDED — SHOOTING',
      badgeEvent:     'RECOMMENDED — EVENT',
      formulaLabel:   'PACKAGE',
      customTitle:    'Custom',
      customPhotos:   'Customizable number of photos',
      customDuration: '~Variable',
      customTagline:  'Every project is different. Let\'s talk.',
      prestations: [
        {
          id: 'SPARK', badge: 'badgeShooting',
          photos: '10 – 20 edited photos', duration: '~1 – 2h',
          features: [
            'Preparation & creative brief',
            'Shooting in club, studio or outdoors',
            'Professional selection & retouching',
            'Private online gallery',
          ],
        },
        {
          id: 'GROOVE', badge: null,
          photos: '30 – 50 edited photos', duration: 'Event ~3h · Shooting ~2h',
          features: [
            'Preparation & creative brief',
            'Shooting during a full set, DJ or group portraits',
            'Professional selection & retouching',
            'Retouching revision included: 1 adjustment per photo',
            'Private online gallery',
          ],
        },
        {
          id: 'NIGHTLIFE', badge: null,
          photos: '60 – 100 edited photos', duration: 'Event ~event duration · Shooting ~3h',
          features: [
            'Preparation & creative brief',
            'Full event coverage or artistic shooting',
            'Professional selection & retouching',
            'Retouching revisions included: 2 adjustments per photo',
            'Private online gallery',
          ],
        },
        {
          id: 'IMMERSION', badge: 'badgeEvent',
          photos: '100 – 160 edited photos', duration: 'Full event · Shooting ~5h',
          features: [
            'Preparation & creative brief',
            'Detailed shooting during a party, DJ set or artistic project',
            'Professional selection & retouching',
            'Retouching revisions included: 2 adjustments per photo',
            'Private online gallery',
          ],
        },
      ],
      customFeatures: [
        'Personalized preparation & creative brief',
        'Multi-day events, festivals, long trips or ambitious projects',
        'Professional selection & retouching',
        'Retouching revisions included: 2 adjustments per photo',
        'Private online gallery',
      ],
    },

    contact: {
      label:        'CONTACT',
      title:        "Let's work together",
      subtitle:     'A project, an idea, a question? Tell me what you have in mind and I\'ll get back to you quickly.',
      availableFor: 'Available for',
      availableItems: [
        'Artistic shootings & portraits',
        'Nightlife events & parties',
        'Brand communication',
        'Creative collaborations',
        'Custom projects & festivals',
      ],
      location:    'Based in Paris & Corsica —\navailable for travel across France and internationally.',
      seeTarifs:   'SEE PRICING →',
      formTitle:   'Your message',
      nameLabel:   'NAME',
      namePlaceholder: 'Your name',
      emailLabel:  'EMAIL',
      projectLabel: 'PROJECT TYPE',
      projectPlaceholder: '— Choose a package',
      messageLabel: 'MESSAGE',
      messagePlaceholder: 'Describe your project — venue, date, desired atmosphere…',
      sendBtn:     'SEND MY REQUEST',
      mailHint:    'Clicking send will open your mail client with the message pre-filled.',
      sentTitle:   'Thank you!',
      sentBody:    'I\'ll get back to you very soon.',
      mailSubject: 'Quote request',
      projets: [
        'SPARK Shooting (1–2h, 10–20 photos)',
        'GROOVE Shooting (2–3h, 30–50 photos)',
        'NIGHTLIFE Event (60–100 photos)',
        'IMMERSION Event (100–160 photos)',
        'Custom package',
        'Other',
      ],
    },

    don: {
      label:       'SUPPORT',
      title:       'Make a donation',
      subTitle:    "Do you enjoy\nmy work?",
      p1:          "I'm a student and I do photography out of passion — to tell emotional stories through the nights, the artists, the lights and the shared moments. Every photo is an attempt to capture the energy of a place, the sensitivity of a moment and the magic that comes from the beauty of illuminated shadows.",
      p2:          "If my work moves you and you'd like to support what I do, you can leave a small donation. Even 1\u00a0€, 2\u00a0€, 5\u00a0€ or more — whatever you can — is already an enormous support and helps me continue to create and photograph these precious moments.",
      p3:          "Thank you sincerely\u00a0:')",
      amountHint:  "CHOOSE THE AMOUNT THAT SUITS YOU — 1 €, 2 €, 5 € or more",
      viaPaypal:   'VIA PAYPAL',
      paypalBtn:   'DONATE VIA PAYPAL',
      viaLydia:    'VIA LYDIA / SUMERIA',
      lydiaBtn:    'DONATE VIA LYDIA',
      contactHint: 'Need photos or a collaboration?',
      contactLink: 'Contact me',
    },

    albums: {
      all:    'ALL',
      drag:   '← DRAG →',
      dateLocale: 'en-GB',
    },

    footer: {
      mentions: 'Legal notice',
      madeBy:   'Created by',
      and:      '&',
    },

    bottomBar: {
      enjoy:   'Enjoying my work?',
      donate:  'Make a donation',
      contact: 'CONTACT',
    },
  },
} as const;

export type Translations = typeof translations['fr'];

export function getT(lang: Lang): Translations {
  return translations[lang] as unknown as Translations;
}
