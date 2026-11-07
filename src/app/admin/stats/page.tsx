import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/server/requireAdmin';
import { fetchKpis } from '@/lib/server/stats';
import StatsView from './StatsView';
import RetryButton from './RetryButton';
import { dayLabel, dayYearLabel } from './format';
import './stats.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Statistiques — Admin', robots: { index: false, follow: false } };

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

function parsePeriod(v: string | string[] | undefined): Period {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return (PERIODS as readonly number[]).includes(n) ? (n as Period) : 30;
}

function Head({ days, range }: { days: Period; range?: string }) {
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">Statistiques</p>
        <h1>Suivi des téléchargements</h1>
      </div>
      <div className="period">
        <nav className="seg" aria-label="Période d’analyse">
          {PERIODS.map((p) => (
            <Link key={p} href={`/admin/stats?p=${p}`} aria-current={p === days ? 'true' : undefined}>
              {p}&nbsp;jours
            </Link>
          ))}
        </nav>
        {range ? <p className="range"><span className="sr-only">Période affichée : </span>{range}</p> : null}
      </div>
    </div>
  );
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ p?: string | string[] }> }) {
  // Defence in depth: src/proxy.ts already guards /admin/**.
  const user = await getAdminUser();
  if (!user) redirect('/admin/login?redirect=/admin/stats');

  const days = parsePeriod((await searchParams).p);
  const res = await fetchKpis(days);

  return (
    <div className="st">
      {!res.ok ? (
        <>
          <Head days={days} />
          <div className="alert" role="alert">
            <span className="ic" aria-hidden="true">!</span>
            <div>
              <h2 tabIndex={-1} id="stats-error">Impossible de charger les statistiques</h2>
              <p>Le serveur n’a pas répondu. Vos données ne sont pas perdues. Réessayez dans un instant.</p>
              <div className="alert-actions">
                <RetryButton />
                <Link className="btn secondary" href="/admin">Revenir au tableau de bord</Link>
              </div>
              <details>
                <summary>Détail technique</summary>
                <pre>{res.detail}</pre>
              </details>
            </div>
          </div>
        </>
      ) : !res.data.has_data ? (
        <>
          <Head days={days} range={`${dayLabel(res.data.range.start)} – ${dayYearLabel(res.data.range.end)}`} />
          <section className="kpis" aria-label="Indicateurs clés">
            {['Téléchargements', 'Vues', 'Demandes', 'Inscriptions newsletter', 'Abonnés', 'Bande passante estimée'].map((l) => (
              <div className="kpi is-empty" key={l} role="group" aria-label={l}>
                <span className="label">{l}</span><span className="value num">0</span><span className="hint">Aucune donnée</span>
              </div>
            ))}
          </section>
          <section className="card sec" role="status">
            <div className="state">
              <h2>Pas encore de données</h2>
              <p>Les statistiques apparaîtront dès les premières visites. Les vues sont comptées après affichage réel de la photo, sans cookie ni adresse IP stockée.</p>
              <ul className="checks">
                <li>Vues et appareils des photos affichées</li>
                <li>Photos ajoutées à la sélection</li>
                <li>Demandes, liens ouverts et téléchargements</li>
                <li>Inscriptions et abonnés à la newsletter</li>
              </ul>
              <Link className="btn" href="/" target="_blank">Voir le site ↗</Link>
            </div>
          </section>
        </>
      ) : (
        <>
          <Head days={days} range={`${dayLabel(res.data.range.start)} – ${dayYearLabel(res.data.range.end)} · comparée au ${dayLabel(res.data.range.prev_start)} – ${dayYearLabel(res.data.range.prev_end)}`} />
          <StatsView d={res.data} days={days} />
        </>
      )}
    </div>
  );
}
