export type Photo = {
  src: string;
  width: number;
  height: number;
  alt?: string;
};

export type Album = {
  slug: string;
  title: string;
  category: 'event' | 'brand';
  date?: string;
  cover: string;
  description?: string;
  photos: Photo[];
};

/* ──────────────────────────────────────────────
   Placeholder images: replace src values with
   your actual hosted photo URLs.
   Dimensions keep the real aspect ratios.
   portrait = 2:3  (667×1000)
   landscape = 4:3 (1000×750)
────────────────────────────────────────────── */

const placeholder = (seed: number, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const albums: Album[] = [
  /* ── EVENTS ── */
  {
    slug: 'furtive-25',
    title: 'FURTIVE 25',
    category: 'event',
    date: '2025',
    cover: placeholder(101, 1000, 667),
    description: 'Nuit de techno minimale, fumée et stroboscopes. Furtive saison 25.',
    photos: [
      { src: placeholder(101, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(102, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(103, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(104, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(105, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(106, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(107, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(108, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(109, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(110, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(111, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(112, 1000, 750), width: 1000, height: 750 },
    ],
  },
  {
    slug: 'furtive-24',
    title: 'FURTIVE 24',
    category: 'event',
    date: '2024',
    cover: placeholder(201, 1000, 667),
    description: 'Édition 24.',
    photos: [
      { src: placeholder(201, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(202, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(203, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(204, 1000, 750), width: 1000, height: 750 },
    ],
  },
  {
    slug: 'onesh',
    title: 'ONESH',
    category: 'event',
    date: '2024',
    cover: placeholder(301, 1000, 667),
    description: 'Soirée ONESH.',
    photos: [
      { src: placeholder(301, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(302, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(303, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(304, 1000, 750), width: 1000, height: 750 },
    ],
  },
  {
    slug: 'fightclub',
    title: 'FIGHTCLUB',
    category: 'event',
    date: '2024',
    cover: placeholder(401, 1000, 667),
    description: 'Event FIGHTCLUB.',
    photos: [
      { src: placeholder(401, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(402, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(403, 667, 1000), width: 667, height: 1000 },
    ],
  },
  {
    slug: 'uforecordz',
    title: 'UFO RECORDZ',
    category: 'event',
    date: '2024',
    cover: placeholder(501, 1000, 667),
    description: 'UFO Recordz.',
    photos: [
      { src: placeholder(501, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(502, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(503, 667, 1000), width: 667, height: 1000 },
    ],
  },
  /* ── BRANDS ── */
  {
    slug: 'atria-records',
    title: 'ATRIA RECORDS',
    category: 'brand',
    date: '2024',
    cover: placeholder(601, 1000, 667),
    description: 'Label ATRIA RECORDS.',
    photos: [
      { src: placeholder(601, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(602, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(603, 667, 1000), width: 667, height: 1000 },
    ],
  },
  {
    slug: 'technoshop',
    title: 'TECHNOSHOP',
    category: 'brand',
    date: '2024',
    cover: placeholder(701, 1000, 667),
    description: 'Shooting TECHNOSHOP.',
    photos: [
      { src: placeholder(701, 667, 1000), width: 667, height: 1000 },
      { src: placeholder(702, 1000, 750), width: 1000, height: 750 },
      { src: placeholder(703, 667, 1000), width: 667, height: 1000 },
    ],
  },
];
