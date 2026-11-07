import Image from 'next/image';
import type { KpiData, RankedPhoto } from '@/lib/server/stats';
import { bytesLabel, dayLabel, dayYearLabel, delta, fmt, niceMax, percents, pct0, pct1, photoName, type Delta } from './format';

/* /admin/stats content, server-rendered. Plain SVG/CSS charts (D-11), every chart has a data table. */

const GLYPH: Record<Delta['kind'], string> = { up: '▲', down: '▼', flat: '▬', new: '▲', none: '▬' };

function DeltaLine({ d, label }: { d: Delta; label: string }) {
  const cls = d.kind === 'new' ? 'up' : d.kind === 'none' ? 'flat' : d.kind;
  return (
    <span className={`delta ${cls}`}>
      <span aria-hidden="true">{GLYPH[d.kind]}</span>
      <span>{d.text}</span>
      {d.kind !== 'new' && d.kind !== 'flat' ? <span className="vs">{label}</span> : null}
      <span className="sr-only">, {d.sr}</span>
    </span>
  );
}

function Kpi({ label, value, unit, d, vs, hint }: { label: string; value: string; unit?: string; d: Delta; vs: string; hint: string }) {
  return (
    <div className="kpi" role="group" aria-label={label}>
      <span className="label">{label}</span>
      <span className="value num">{value}{unit ? <small>{unit}</small> : null}</span>
      <DeltaLine d={d} label={vs} />
      <span className="hint">{hint}</span>
    </div>
  );
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="data">
      <summary>Voir les données (tableau)</summary>
      <div className="tbl-wrap" tabIndex={0} role="region" aria-label={caption}>
        <table>
          <caption>{caption}</caption>
          <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function SeriesPanel({ id, title, total, values, labels, color, titleText, relative }: {
  id: string; title: string; total: string; values: number[]; labels: string[]; color: string; titleText: string; relative?: boolean;
}) {
  const max = niceMax(Math.max(...values, relative ? 1 : 0));
  const n = values.length;
  const pts = values.map((v, i) => [n === 1 ? 150 : (i / (n - 1)) * 300, 100 - (v / max) * 100] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const area = `${line}L300 100L0 100Z`;
  const last = pts[pts.length - 1];
  const idx = [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1];
  const xl = n > 1 ? idx.map((i) => labels[i]) : [labels[0]];
  return (
    <div className="panel">
      <div className="panel-title"><b>{title}</b><span className="sub num">{total}</span></div>
      <div className="yaxis" aria-hidden="true">
        <span style={{ top: '0%' }}>{fmt(max)}</span>
        <span style={{ top: '50%' }}>{fmt(max / 2)}</span>
        <span style={{ top: '100%' }}>0</span>
      </div>
      <div className="plot">
        <svg viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-labelledby={`${id}-t`}>
          <title id={`${id}-t`}>{titleText}</title>
          {[0, 50, 100].map((y) => (
            <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgba(255,255,255,.08)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill={color} fillOpacity=".14" />
          <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="end" style={{ left: '100%', top: `${last[1]}%`, background: color }} />
      </div>
      <div className="xaxis" aria-hidden="true">{xl.map((l, i) => <span key={i}>{l}</span>)}</div>
    </div>
  );
}

const unoptimisedHost = (src: string) => {
  try { return !new URL(src).hostname.endsWith('.supabase.co'); } catch { return true; }
};

function Thumb({ src }: { src: string | null }) {
  if (!src) return <span className="thumb" aria-hidden="true" style={{ background: 'linear-gradient(135deg,#2b2b2b,#141414)' }} />;
  return (
    <Image className="thumb" src={src} alt="" width={52} height={52} sizes="52px" unoptimized={unoptimisedHost(src)}
      style={{ objectFit: 'cover' }} />
  );
}

function Ranking({ id, title, sub, unit, items, color, tableLabel, countHead }: {
  id: string; title: string; sub: string; unit: string; items: RankedPhoto[]; color: string; tableLabel: string; countHead: string;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <section className="card" aria-labelledby={id}>
      <div className="card-head"><h2 id={id}>{title}</h2><span className="sub">{sub}</span></div>
      {items.length === 0 ? <p className="sub">Aucune donnée sur cette période.</p> : (
        <>
          <ol className="rank">
            {items.map((it, i) => (
              <li key={it.photo_id}>
                <span className="pos">{i + 1}</span>
                <Thumb src={it.src} />
                <span className="meta">
                  <span className="t">{photoName(it.alt, it.src)}</span>
                  <span className="s">{it.album_title ?? 'Portfolio'}</span>
                  <span className="meter" role="presentation"><i style={{ width: `${(it.count / max) * 100}%`, background: color }} /></span>
                </span>
                <span className="cnt">{fmt(it.count)}<small>{unit}</small></span>
              </li>
            ))}
          </ol>
          <DataTable caption={tableLabel} head={['Photo', 'Album', countHead]}
            rows={items.map((it) => [photoName(it.alt, it.src), it.album_title ?? 'Portfolio', fmt(it.count)])} />
        </>
      )}
    </section>
  );
}

export default function StatsView({ d, days }: { d: KpiData; days: 7 | 30 | 90 }) {
  const t = d.totals;
  const vs = `vs ${days} j préc.`;
  const rangeTxt = `${dayLabel(d.range.start)} – ${dayYearLabel(d.range.end)}`;
  const bw = bytesLabel(t.bytes.cur);
  const signupRate = t.requests.cur > 0 ? (t.signups.cur / t.requests.cur) * 100 : null;
  const sub = d.subscribers;
  const subGrowth = sub.gained - sub.lost;
  const subDelta: Delta = sub.base > 0
    ? delta(sub.base + subGrowth, sub.base)
    : subGrowth > 0 ? { kind: 'new', text: 'Nouveau', sr: 'nouveau sur la période' } : { kind: 'flat', text: 'stable', sr: 'stable sur la période' };
  const noWindowData = t.views.cur + t.downloads.cur + t.requests.cur + t.signups.cur === 0;

  const dayLabels = d.daily.map((x) => dayLabel(x.day));
  const views = d.daily.map((x) => x.views);
  const dls = d.daily.map((x) => x.downloads);
  const ratio = t.downloads.cur > 0 ? Math.round(t.views.cur / t.downloads.cur) : 0;
  const f = d.funnel;
  const steps = [
    { name: 'Visiteurs-jours ayant vu une photo', n: f.visitor_days, color: '#8fbcf0' },
    { name: 'Demandes de téléchargement', n: f.requests, color: '#5f9de8' },
    { name: 'Liens ouverts', n: f.links_opened, color: '#3987e5' },
    { name: 'Téléchargés', n: f.downloaded, color: '#2a67b4' },
  ];
  const conv = (i: number) => (steps[i - 1].n > 0 ? (steps[i].n / steps[i - 1].n) * 100 : null);
  const globalConv = f.visitor_days > 0 ? (f.downloaded / f.visitor_days) * 100 : null;

  const dn = d.day_night;
  const dnP = percents([dn.day, dn.night]);
  const dv = d.devices;
  const dvVals = [dv.mobile, dv.desktop, dv.tablet];
  const dvP = percents(dvVals);
  const devs = [
    { k: 'Mobile', v: dv.mobile, p: dvP[0], color: 'var(--c-aqua)', tex: '' },
    { k: 'Ordinateur', v: dv.desktop, p: dvP[1], color: 'var(--c-downloads)', tex: 'tex-stripe' },
    { k: 'Tablette', v: dv.tablet, p: dvP[2], color: 'var(--c-views)', tex: 'tex-dot' },
  ];
  const growth = d.sub_series.map((x) => x.total - sub.base);
  const empty = (msg = 'Aucune donnée sur cette période.') => <p className="sub">{msg}</p>;

  return (
    <>
      <section aria-labelledby="h-kpi">
        <h2 className="sr-only" id="h-kpi">Indicateurs clés</h2>
        <div className="kpis">
          <Kpi label="Téléchargements" value={fmt(t.downloads.cur)} d={delta(t.downloads.cur, t.downloads.prev)} vs={vs} hint="fichiers servis" />
          <Kpi label="Vues" value={fmt(t.views.cur)} d={delta(t.views.cur, t.views.prev)} vs={vs}
            hint={`${fmt(t.visitor_days.cur)} visiteurs-jours (uniques par jour)`} />
          <Kpi label="Demandes" value={fmt(t.requests.cur)} d={delta(t.requests.cur, t.requests.prev)} vs={vs} hint="liens envoyés par email" />
          <Kpi label="Inscriptions newsletter" value={fmt(t.signups.cur)} d={delta(t.signups.cur, t.signups.prev)} vs={vs}
            hint={`${signupRate === null ? '–' : pct1(signupRate)} des demandes · ${fmt(t.signups.confirmed)} confirmées`} />
          <Kpi label="Abonnés" value={fmt(sub.now)} d={subDelta} vs="sur la période" hint={`+${fmt(sub.gained)} / −${fmt(sub.lost)} sur la période`} />
          <Kpi label="Bande passante estimée" value={bw.value} unit={bw.unit} d={delta(t.bytes.cur, t.bytes.prev)} vs={vs}
            hint="téléchargements uniquement" />
        </div>
      </section>

      <section className="card sec" aria-labelledby="h-ts">
        <div className="card-head">
          <h2 id="h-ts">Vues et téléchargements par jour</h2>
          <ul className="legend" aria-label="Légende">
            <li><span className="sw line" style={{ background: 'var(--c-views)' }} />Vues</li>
            <li><span className="sw line" style={{ background: 'var(--c-downloads)' }} />Téléchargements</li>
          </ul>
        </div>
        {noWindowData ? empty() : (
          <>
            <SeriesPanel id="cv" title="Vues" total={`${fmt(t.views.cur)} au total`} values={views} labels={dayLabels} color="var(--c-views)"
              titleText={`Courbe des vues par jour, ${fmt(t.views.cur)} au total sur ${days} jours`} />
            <SeriesPanel id="cd" title="Téléchargements" total={`${fmt(t.downloads.cur)} au total`} values={dls} labels={dayLabels} color="var(--c-downloads)"
              titleText={`Courbe des téléchargements par jour, ${fmt(t.downloads.cur)} au total sur ${days} jours`} />
            <p className="note">
              Deux échelles distinctes{ratio >= 3 ? ` : les vues sont environ ${fmt(ratio)} fois plus nombreuses que les téléchargements` : ''}. Jours calculés en heure de Paris.
            </p>
            <DataTable caption={`Vues et téléchargements par jour, ${days} derniers jours`} head={['Jour', 'Vues', 'Téléchargements']}
              rows={[...d.daily].reverse().map((x) => [dayLabel(x.day), fmt(x.views), fmt(x.downloads)])} />
          </>
        )}
      </section>

      <section className="card sec" aria-labelledby="h-fn">
        <div className="card-head"><h2 id="h-fn">Tunnel de téléchargement</h2><span className="sub">Conversion globale {globalConv === null ? '–' : pct1(globalConv)}</span></div>
        {noWindowData ? empty() : (
          <>
            <ol className="funnel">
              {steps.map((s, i) => (
                <li key={s.name} style={{ display: 'contents' }}>
                  {i > 0 ? (
                    <div className="conv"><span><b>{conv(i) === null ? '–' : pct1(conv(i) as number)}</b> passent à l’étape suivante</span></div>
                  ) : null}
                  <div className="step">
                    <span className="name">{i + 1}. {s.name}</span>
                    <span className="n">{fmt(s.n)}</span>
                    <span className="bar" role="presentation"><i style={{ width: `${steps[0].n > 0 ? Math.min(100, (s.n / steps[0].n) * 100) : 0}%`, background: s.color }} /></span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="note">L’étape 1 compte des visiteurs-jours ; les étapes 2 à 4 comptent des demandes. Les taux entre l’étape 1 et la suite sont donc indicatifs.</p>
            <DataTable caption="Tunnel de téléchargement" head={['Étape', 'Effectif', 'Conversion depuis l’étape précédente']}
              rows={steps.map((s, i) => [s.name, fmt(s.n), i === 0 ? '–' : conv(i) === null ? '–' : pct1(conv(i) as number)])} />
          </>
        )}
      </section>

      <div className="two sec">
        <Ranking id="h-fav" title="Photos préférées" sub="Ajouts à la sélection" unit="ajouts" items={d.top_favorites} color="var(--accent)"
          tableLabel="Photos les plus ajoutées à la sélection" countHead="Ajouts" />
        <Ranking id="h-dl" title="Plus téléchargées" sub="Fichiers servis" unit="téléch." items={d.top_downloads} color="var(--c-downloads)"
          tableLabel="Photos les plus téléchargées" countHead="Téléchargements" />
      </div>

      <section className="card sec" aria-labelledby="h-al">
        <div className="card-head"><h2 id="h-al">Albums les plus consultés</h2><span className="sub">Vues · téléchargements</span></div>
        {d.top_albums.length === 0 ? empty() : (
          <>
            <ol className="rank albums">
              {d.top_albums.map((a, i) => (
                <li key={a.album_id}>
                  <span className="pos">{i + 1}</span>
                  <span className="meta">
                    <span className="t">{a.title ?? 'Album supprimé'}{a.is_public ? null : <span className="badge">Privé</span>}</span>
                    <span className="meter" role="presentation"><i style={{ width: `${(a.views / Math.max(d.top_albums[0].views, 1)) * 100}%`, background: 'var(--c-views)' }} /></span>
                  </span>
                  <span className="cnt">{fmt(a.views)}<small>vues</small></span>
                  <span className="cnt">{fmt(a.downloads)}<small>téléch.</small></span>
                </li>
              ))}
            </ol>
            <DataTable caption="Albums les plus consultés" head={['Album', 'Accès', 'Vues', 'Téléchargements']}
              rows={d.top_albums.map((a) => [a.title ?? 'Album supprimé', a.is_public ? 'Public' : 'Privé', fmt(a.views), fmt(a.downloads)])} />
          </>
        )}
      </section>

      <div className="two sec">
        <section className="card" aria-labelledby="h-dn">
          <div className="card-head"><h2 id="h-dn">Jour / nuit</h2><span className="sub">Mode du site à la vue</span></div>
          {dn.day + dn.night === 0 ? empty() : (
            <>
              <div className="stack" role="img" aria-label={`Jour ${pct1(dnP[0])}, nuit ${pct1(dnP[1])}`}>
                <i style={{ width: `${dnP[0]}%`, background: 'var(--c-day)' }} /><i style={{ width: `${dnP[1]}%`, background: 'var(--c-night)' }} />
              </div>
              <ul className="split-list">
                <li><span className="sw" style={{ background: 'var(--c-day)' }} /><span className="k">☀ Jour</span><span className="p">{pct0(dnP[0])}</span><span className="c">{fmt(dn.day)}</span></li>
                <li><span className="sw" style={{ background: 'var(--c-night)' }} /><span className="k">☾ Nuit</span><span className="p">{pct0(dnP[1])}</span><span className="c">{fmt(dn.night)}</span></li>
              </ul>
              <p className="note">Le visiteur choisit le mode ; ce n’est pas l’heure de la vue.</p>
            </>
          )}
        </section>
        <section className="card" aria-labelledby="h-dv">
          <div className="card-head"><h2 id="h-dv">Appareils</h2><span className="sub">Classe d’appareil</span></div>
          {dvVals.reduce((a, b) => a + b, 0) === 0 ? empty() : (
            <>
              <div className="stack" role="img" aria-label={devs.map((x) => `${x.k} ${pct0(x.p)}`).join(', ')}>
                {devs.map((x) => <i key={x.k} className={x.tex} style={{ width: `${x.p}%`, background: x.color }} />)}
              </div>
              <ul className="split-list">
                {devs.map((x) => (
                  <li key={x.k}><span className={`sw ${x.tex}`} style={{ backgroundColor: x.color }} /><span className="k">{x.k}</span><span className="p">{pct0(x.p)}</span><span className="c">{fmt(x.v)}</span></li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <section className="card sec" aria-labelledby="h-sg">
        <div className="card-head"><h2 id="h-sg">Croissance des abonnés</h2><span className="sub num">{fmt(sub.now)} abonnés confirmés</span></div>
        {sub.gained + sub.lost === 0 ? empty('Aucun mouvement d’abonnés sur cette période.') : (
          <>
            <SeriesPanel id="cs" title="Abonnés confirmés (cumul)" total={`+${fmt(sub.gained)} / −${fmt(sub.lost)}`} values={growth}
              labels={d.sub_series.map((x) => dayLabel(x.day))} color="var(--c-aqua)" relative
              titleText={`Cumul des abonnés confirmés sur ${days} jours, de ${fmt(sub.base)} à ${fmt(sub.base + subGrowth)}`} />
            <p className="note">Échelle relative : l’axe vertical montre le gain depuis le début de la période (0 = {fmt(sub.base)} abonnés).</p>
            <DataTable caption="Abonnés confirmés par jour" head={['Jour', 'Abonnés confirmés']}
              rows={[...d.sub_series].reverse().map((x) => [dayLabel(x.day), fmt(x.total)])} />
          </>
        )}
      </section>

      <p className="foot">
        Les événements bruts sont conservés 13 mois puis supprimés ; les agrégats restent. Aucun cookie, aucune adresse IP stockée.
        Bande passante : octets des fichiers téléchargés, hors images du site servies par le CDN.
        Période : {rangeTxt}, comparée au {dayLabel(d.range.prev_start)} – {dayYearLabel(d.range.prev_end)}. Les périodes se terminent hier (heure de Paris).
      </p>
    </>
  );
}

