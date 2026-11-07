const nf = new Intl.NumberFormat('fr-FR');
const nf1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dayYearFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const fmt = (n: number) => nf.format(n);
export const pct1 = (n: number) => `${nf1.format(n)} %`;
export const pct0 = (n: number) => `${nf.format(Math.round(n))} %`;

/** 'YYYY-MM-DD' (a Paris calendar day) -> '6 nov.' */
export const dayLabel = (d: string) => dayFmt.format(new Date(`${d}T12:00:00Z`));
export const dayYearLabel = (d: string) => dayYearFmt.format(new Date(`${d}T12:00:00Z`));

export function bytesLabel(b: number): { value: string; unit: string } {
  if (b >= 1024 ** 4) return { value: nf1.format(b / 1024 ** 4), unit: 'To' };
  if (b >= 1024 ** 3) return { value: nf1.format(b / 1024 ** 3), unit: 'Go' };
  return { value: nf1.format(b / 1024 ** 2), unit: 'Mo' };
}

export interface Delta { kind: 'up' | 'down' | 'flat' | 'new' | 'none'; text: string; sr: string }

/** Delta % = round((cur - prev) / prev * 100); undefined when prev = 0. */
export function delta(cur: number, prev: number): Delta {
  if (prev === 0 && cur === 0) return { kind: 'flat', text: 'stable', sr: 'stable par rapport à la période précédente' };
  if (prev === 0) return { kind: 'new', text: 'Nouveau', sr: 'nouveau par rapport à la période précédente' };
  const p = Math.round(((cur - prev) / prev) * 100);
  if (p === 0) return { kind: 'flat', text: 'stable', sr: 'stable par rapport à la période précédente' };
  const sign = p > 0 ? '+' : '−';
  return {
    kind: p > 0 ? 'up' : 'down',
    text: `${sign}${nf.format(Math.abs(p))} %`,
    sr: p > 0 ? 'en hausse par rapport à la période précédente' : 'en baisse par rapport à la période précédente',
  };
}

/** Round the max up to 1 / 2 / 2.5 / 5 x 10^k. */
export function niceMax(v: number): number {
  if (v <= 1) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * exp >= v) return m * exp;
  return 10 * exp;
}

/** Largest-remainder rounding so the percentages sum to exactly 100. */
export function percents(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floor = raw.map(Math.floor);
  let rest = 100 - floor.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, f: r - Math.floor(r) })).sort((a, b) => b.f - a.f);
  for (const o of order) {
    if (rest <= 0) break;
    floor[o.i] += 1;
    rest -= 1;
  }
  return floor;
}

export function photoName(alt: string | null, src: string | null): string {
  if (alt && alt.trim()) return alt.trim();
  if (!src) return 'Photo supprimée';
  try {
    const last = decodeURIComponent(new URL(src).pathname.split('/').pop() ?? '');
    return last.replace(/\.[a-z0-9]+$/i, '') || 'Photo';
  } catch {
    return 'Photo';
  }
}
