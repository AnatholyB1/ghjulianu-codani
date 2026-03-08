/* Portfolio selection – mix of portrait (2:3) and landscape (4:3/3:2) */
const p = (seed: number, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export type PortfolioPhoto = {
  src: string;
  width: number;
  height: number;
  alt?: string;
  span?: 'tall' | 'wide' | 'normal'; // grid behavior hint
};

export const portfolioPhotos: PortfolioPhoto[] = [
  { src: p(11, 667, 1000), width: 667, height: 1000, span: 'tall' },
  { src: p(12, 1000, 750), width: 1000, height: 750, span: 'wide' },
  { src: p(13, 667, 1000), width: 667, height: 1000, span: 'normal' },
  { src: p(14, 667, 1000), width: 667, height: 1000, span: 'normal' },
  { src: p(15, 1000, 750), width: 1000, height: 750, span: 'wide' },
  { src: p(16, 667, 1000), width: 667, height: 1000, span: 'tall' },
  { src: p(17, 1000, 750), width: 1000, height: 750, span: 'normal' },
  { src: p(18, 667, 1000), width: 667, height: 1000, span: 'normal' },
  { src: p(19, 667, 1000), width: 667, height: 1000, span: 'tall' },
  { src: p(20, 1000, 750), width: 1000, height: 750, span: 'wide' },
  { src: p(21, 667, 1000), width: 667, height: 1000, span: 'normal' },
  { src: p(22, 1000, 750), width: 1000, height: 750, span: 'normal' },
  { src: p(23, 667, 1000), width: 667, height: 1000, span: 'normal' },
  { src: p(24, 1000, 750), width: 1000, height: 750, span: 'wide' },
  { src: p(25, 667, 1000), width: 667, height: 1000, span: 'tall' },
  { src: p(26, 1000, 750), width: 1000, height: 750, span: 'normal' },
  { src: p(27, 667, 1000), width: 667, height: 1000, span: 'normal' },
  { src: p(28, 1000, 750), width: 1000, height: 750, span: 'wide' },
];
